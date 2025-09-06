// Import AWS SDK
import AWS from 'aws-sdk'

// Import Logger
import { logger } from '../shared/logger'

// AWS SDK clients
const rds = new AWS.RDS()
const elasticache = new AWS.ElastiCache()
const apprunner = new AWS.AppRunner()
const lambda = new AWS.Lambda()
const ec2 = new AWS.EC2()
const sts = new AWS.STS()
const cloudfront = new AWS.CloudFront()
const scheduler = new AWS.Scheduler()
const cloudwatchLogs = new AWS.CloudWatchLogs()
const cloudwatch = new AWS.CloudWatch()
const s3 = new AWS.S3()

interface ProvisionedConcurrencyDetail {
  qualifier: string
  allocated: number
  requested: number
  status: string
}

interface LambdaFunctionDetails {
  functionName: string
  functionArn: string
  runtime?: string
  memorySize?: number
  timeout?: number
  lastModified?: string
  version?: string
  state?: string
  reservedConcurrentExecutions: number | null
  provisionedConcurrency: ProvisionedConcurrencyDetail[]
}

interface EC2InstanceDetails {
  instanceId: string
  arn?: string
  name?: string
  state?: string
  instanceType?: string
  publicIpAddress?: string
  privateIpAddress?: string
  availabilityZone?: string
  vpcId?: string
  subnetId?: string
  securityGroupIds: string[]
  launchTime?: string
  platform?: string
  architecture?: string
}

interface CloudFrontDistributionDetails {
  id: string
  arn?: string
  domainName?: string
  aliases: string[]
  enabled: boolean
  status?: string
  priceClass?: string
}

interface ResourceStatus {
  rds: {
    status: string
    clusterId: string
    message: string
  }
  elasticache: {
    status: string
    replicationGroupId: string
    message: string
  }
  apprunner: {
    status: string
    serviceArn: string
    message: string
  }
  cloudfront: {
    status: string
    distributions: CloudFrontDistributionDetails[]
    message: string
  }
  lambda: {
    status: string
    functionCount: number
    message: string
    functions: LambdaFunctionDetails[]
  }
  ec2: {
    status: string
    instanceCount: number
    message: string
    instances: EC2InstanceDetails[]
  }
}

interface ShutdownResult {
  success: boolean
  resources: {
    rds: boolean
    elasticache: boolean
    apprunner: boolean
    lambda: boolean
    ec2: boolean
    cloudfront: Record<string, boolean>
  }
  errors: string[]
  status?: ResourceStatus
}

interface CloudWatchLogGroup {
  logGroupName: string
  storedBytes: number
  retentionInDays?: number
  creationTime?: number
  metricFilterCount?: number
  arn?: string
}

interface CloudWatchCostAnalysis {
  totalCost: number
  breakdown: {
    logIngestion: number
    logStorage: number
    s3Egress: number
    alarms: number
    metrics: number
  }
  recommendations: {
    potentialSavings: number
    actions: string[]
  }
  logGroups: CloudWatchLogGroup[]
}

interface CloudWatchOptimizationResult {
  success: boolean
  appliedRetentionPolicies: number
  estimatedMonthlySavings: number
  errors: string[]
  details: {
    logGroupName: string
    previousRetention?: number
    newRetention: number
    estimatedSavings: number
  }[]
}

interface S3BucketAnalysis {
  bucketName: string
  region: string
  totalSize: number
  objectCount: number
  storageClass: string
  hasLifecyclePolicy: boolean
  hasIntelligentTiering: boolean
  estimatedMonthlyCost: number
  lastModified?: Date
}

interface S3CostAnalysis {
  totalCost: number
  breakdown: {
    standardStorage: number
    intelligentTiering: number
    requests: number
    dataTransfer: number
  }
  buckets: S3BucketAnalysis[]
  recommendations: Array<{
    bucketName: string
    recommendation: string
    estimatedSavings: number
    priority: 'high' | 'medium' | 'low'
  }>
}

interface S3OptimizationResult {
  success: boolean
  appliedOptimizations: number
  estimatedMonthlySavings: number
  errors: string[]
  details: Array<{
    bucketName: string
    action: string
    configuration?: any
    estimatedSavings?: number
  }>
}

export class ResourceManagerService {
  private readonly environment: string
  private readonly region: string
  private readonly projectName: string

  constructor() {
    this.environment = process.env.NODE_ENV || 'dev'
    this.region = process.env.AWS_REGION_NAME || process.env.AWS_DEFAULT_REGION || 'us-east-1'
    this.projectName = process.env.PROJECT_NAME || 'legitmark'
    
    // Configure AWS SDK with default region
    AWS.config.update({ region: this.region })
    
    // Log the configured region for debugging
    logger.info('ResourceManagerService initialized', {
      component: 'service',
      environment: this.environment,
      region: this.region,
      projectName: this.projectName
    })
  }

  /**
   * Decide whether a Lambda function should be excluded from shutdown/startup management.
   * Currently excludes the resource manager itself and any function explicitly matching
   * the service name pattern.
   */
  private isExcludedLambda(func: AWS.Lambda.FunctionConfiguration): boolean {
    const thisArn = process.env.LAMBDA_FUNCTION_ARN
    const name = func.FunctionName || ''
    const arn = func.FunctionArn || ''
    if (thisArn && arn === thisArn) return true
    if (name.includes('resource-manager-service')) return true
    return false
  }

  /**
   * Common tag requirements for resource discovery/operations
   */
  private getCommonTags(): Record<string, string> {
    return {
      Environment: this.environment,
      ManagedBy: 'terraform',
      Project: this.projectName
    }
  }

  /**
   * Match helper for AWS tag arrays: [{ Key, Value }]
   */
  private tagsArrayMatch(required: Record<string, string>, tagList: Array<{ Key?: string; Value?: string }> | undefined): boolean {
    if (!tagList || tagList.length === 0) return false
    const tagMap: Record<string, string> = {}
    for (const t of tagList) {
      if (t.Key && typeof t.Value === 'string') tagMap[t.Key] = t.Value
    }
    return this.tagsMapMatch(required, tagMap)
  }

  /**
   * Match helper for AWS tag maps: { key: value }
   */
  private tagsMapMatch(required: Record<string, string>, tagMap: Record<string, string> | undefined): boolean {
    if (!tagMap) return false
    for (const [key, val] of Object.entries(required)) {
      if (tagMap[key] !== val) return false
    }
    return true
  }

  /**
   * Build EC2 Filters for required tags
   */
  private buildEc2TagFilters(required: Record<string, string>): AWS.EC2.Filter[] {
    const filters: AWS.EC2.Filter[] = []
    for (const [key, val] of Object.entries(required)) {
      filters.push({ Name: `tag:${key}`, Values: [val] })
    }
    return filters
  }

  /**
   * Shutdown all non-production resources for the current environment
   */
  public async shutdownResources(): Promise<ShutdownResult> {
    if (this.environment === 'prod') {
      const message = 'Shutdown operation is blocked in production environment'
      logger.warn(message, { component: 'service', action: 'shutdown', environment: this.environment })
      throw new Error(message)
    }
    logger.info('Starting resource shutdown', { 
      component: 'service', 
      action: 'shutdown',
      environment: this.environment 
    })

    const result: ShutdownResult = {
      success: true,
      resources: {
        rds: false,
        elasticache: false,
        apprunner: false,
        lambda: false,
        ec2: false,
        cloudfront: {}
      },
      errors: []
    }

    try {
      // Shutdown RDS clusters
      try {
        await this.shutdownRDS(this.environment)
        result.resources.rds = true
        logger.info('RDS shutdown completed', { component: 'service', environment: this.environment })
      } catch (error: any) {
        result.errors.push(`RDS: ${error.message}`)
        logger.error('RDS shutdown failed', { component: 'service', error: error.message })
      }

      // Shutdown ElastiCache clusters
      try {
        await this.shutdownElastiCache(this.environment)
        result.resources.elasticache = true
        logger.info('ElastiCache shutdown completed', { component: 'service', environment: this.environment })
      } catch (error: any) {
        result.errors.push(`ElastiCache: ${error.message}`)
        logger.error('ElastiCache shutdown failed', { component: 'service', error: error.message })
      }

      // Shutdown App Runner services
      try {
        await this.shutdownAppRunner(this.environment)
        result.resources.apprunner = true
        logger.info('App Runner shutdown completed', { component: 'service', environment: this.environment })
      } catch (error: any) {
        result.errors.push(`App Runner: ${error.message}`)
        logger.error('App Runner shutdown failed', { component: 'service', error: error.message })
      }

      // Disable CloudFront distributions and record per-id results
      try {
        const dists = await this.findCloudFrontDistributionsByTags(this.environment)
        for (const d of dists) {
          try {
            if (d.Id) {
              await this.disableSingleCloudFront(d.Id)
              result.resources.cloudfront[d.Id] = true
            }
          } catch (e: any) {
            if (d.Id) result.resources.cloudfront[d.Id] = false
            result.errors.push(`CloudFront ${d.Id}: ${e.message}`)
          }
        }
        logger.info('CloudFront disable completed', { component: 'service', environment: this.environment })
      } catch (error: any) {
        result.errors.push(`CloudFront: ${error.message}`)
        logger.error('CloudFront disable failed', { component: 'service', error: error.message })
      }

      // Shutdown Lambda functions (set concurrency to 0) and record per-function
      try {
        const lambdaResults = await this.shutdownLambda(this.environment)
        result.resources.lambda = Object.values(lambdaResults).every(v => v)
        // attach lambda results into status snapshot later
        logger.info('Lambda shutdown completed', { component: 'service', environment: this.environment })
      } catch (error: any) {
        result.errors.push(`Lambda: ${error.message}`)
        logger.error('Lambda shutdown failed', { component: 'service', error: error.message })
      }

      // Shutdown EC2 instances
      try {
        await this.shutdownEC2(this.environment)
        result.resources.ec2 = true
        logger.info('EC2 shutdown completed', { component: 'service', environment: this.environment })
      } catch (error: any) {
        result.errors.push(`EC2: ${error.message}`)
        logger.error('EC2 shutdown failed', { component: 'service', error: error.message })
      }

      if (result.errors.length > 0) {
        result.success = false
      }

      logger.info('Resource shutdown completed', { 
        component: 'service', 
        success: result.success,
        errors: result.errors.length 
      })

      // Attach a full status snapshot to mirror the status endpoint
      try {
        result.status = await this.getResourceStatus()
      } catch {}

      return result
    } catch (error: any) {
      logger.error('Resource shutdown failed', { 
        component: 'service', 
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  /**
   * Startup all non-production resources for the specified environment
   */
  public async startupResources(): Promise<ShutdownResult> {
    if (this.environment === 'prod') {
      const message = 'Startup operation is blocked in production environment'
      logger.warn(message, { component: 'service', action: 'startup', environment: this.environment })
      throw new Error(message)
    }
    logger.info('Starting resource startup', { 
      component: 'service', 
      action: 'startup',
      environment: this.environment 
    })

    const result: ShutdownResult = {
      success: true,
      resources: {
        rds: false,
        elasticache: false,
        apprunner: false,
        lambda: false,
        ec2: false,
        cloudfront: {}
      },
      errors: []
    }

    try {
      // Startup RDS clusters
      try {
        await this.startupRDS(this.environment)
        result.resources.rds = true
        logger.info('RDS startup completed', { component: 'service', environment: this.environment })
      } catch (error: any) {
        result.errors.push(`RDS: ${error.message}`)
        logger.error('RDS startup failed', { component: 'service', error: error.message })
      }

      // Startup ElastiCache clusters
      try {
        await this.startupElastiCache(this.environment)
        result.resources.elasticache = true
        logger.info('ElastiCache startup completed', { component: 'service', environment: this.environment })
      } catch (error: any) {
        result.errors.push(`ElastiCache: ${error.message}`)
        logger.error('ElastiCache startup failed', { component: 'service', error: error.message })
      }

      // Startup App Runner services
      try {
        await this.startupAppRunner(this.environment)
        result.resources.apprunner = true
        logger.info('App Runner startup completed', { component: 'service', environment: this.environment })
      } catch (error: any) {
        result.errors.push(`App Runner: ${error.message}`)
        logger.error('App Runner startup failed', { component: 'service', error: error.message })
      }

      // Enable CloudFront distributions and record per-id results
      try {
        const dists = await this.findCloudFrontDistributionsByTags(this.environment)
        for (const d of dists) {
          try {
            if (d.Id) {
              await this.enableSingleCloudFront(d.Id)
              result.resources.cloudfront[d.Id] = true
            }
          } catch (e: any) {
            if (d.Id) result.resources.cloudfront[d.Id] = false
            result.errors.push(`CloudFront ${d.Id}: ${e.message}`)
          }
        }
        logger.info('CloudFront enable completed', { component: 'service', environment: this.environment })
      } catch (error: any) {
        result.errors.push(`CloudFront: ${error.message}`)
        logger.error('CloudFront enable failed', { component: 'service', error: error.message })
      }

      // Startup Lambda functions (restore concurrency) and record per-function
      try {
        const lambdaResults = await this.startupLambda(this.environment)
        result.resources.lambda = Object.values(lambdaResults).every(v => v)
        logger.info('Lambda startup completed', { component: 'service', environment: this.environment })
      } catch (error: any) {
        result.errors.push(`Lambda: ${error.message}`)
        logger.error('Lambda startup failed', { component: 'service', error: error.message })
      }

      // Startup EC2 instances
      try {
        await this.startupEC2(this.environment)
        result.resources.ec2 = true
        logger.info('EC2 startup completed', { component: 'service', environment: this.environment })
      } catch (error: any) {
        result.errors.push(`EC2: ${error.message}`)
        logger.error('EC2 startup failed', { component: 'service', error: error.message })
      }

      if (result.errors.length > 0) {
        result.success = false
      }

      logger.info('Resource startup completed', { 
        component: 'service', 
        success: result.success,
        errors: result.errors.length 
      })

      // Attach a full status snapshot to mirror the status endpoint
      try {
        result.status = await this.getResourceStatus()
      } catch {}

      return result
    } catch (error: any) {
      logger.error('Resource startup failed', { 
        component: 'service', 
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  /**
   * Get status of all resources for the current environment
   */
  public async getResourceStatus(): Promise<ResourceStatus> {
    logger.info('Getting resource status', { 
      component: 'service', 
      action: 'get-status',
      environment: this.environment 
    })

    const status: ResourceStatus = {
      rds: { status: 'unknown', clusterId: '', message: '' },
      elasticache: { status: 'unknown', replicationGroupId: '', message: '' },
      apprunner: { status: 'unknown', serviceArn: '', message: '' },
      cloudfront: { status: 'unknown', distributions: [], message: '' },
      lambda: { status: 'unknown', functionCount: 0, message: '', functions: [] },
      ec2: { status: 'unknown', instanceCount: 0, message: '', instances: [] }
    }

    try {
      // Get RDS status
      try {
        const rdsStatus = await this.getRDSStatus(this.environment)
        status.rds = rdsStatus
      } catch (error: any) {
        status.rds.message = error.message
      }

      // Get ElastiCache status
      try {
        const elasticacheStatus = await this.getElastiCacheStatus(this.environment)
        status.elasticache = elasticacheStatus
      } catch (error: any) {
        status.elasticache.message = error.message
      }

      // Get App Runner status
      try {
        const apprunnerStatus = await this.getAppRunnerStatus(this.environment)
        status.apprunner = apprunnerStatus
      } catch (error: any) {
        status.apprunner.message = error.message
      }

      // Get CloudFront status
      try {
        const cfStatus = await this.getCloudFrontStatus(this.environment)
        status.cloudfront = cfStatus
      } catch (error: any) {
        status.cloudfront.message = error.message
      }

      // Get Lambda status
      try {
        const lambdaStatus = await this.getLambdaStatus(this.environment)
        status.lambda = lambdaStatus
      } catch (error: any) {
        status.lambda.message = error.message
      }

      // Get EC2 status
      try {
        const ec2Status = await this.getEC2Status(this.environment)
        status.ec2 = ec2Status
      } catch (error: any) {
        status.ec2.message = error.message
      }

      return status
    } catch (error: any) {
      logger.error('Get resource status failed', { 
        component: 'service', 
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  // RDS Management Methods
  private getRdsTarget(environment: string): { type: 'instance' | 'cluster'; id: string } {
    // dev uses single RDS instance; staging/prod use Aurora cluster
    if (environment === 'dev') {
      return { type: 'instance', id: `${environment}-legitmark-db-${this.region}` }
    }
    return { type: 'cluster', id: `${environment}-legitmark-aurora-${this.region}` }
  }

  private async findRdsTargetByTag(environment: string): Promise<{ type: 'instance' | 'cluster'; id: string } | null> {
    try {
      if (environment === 'dev') {
        const instances = await rds.describeDBInstances().promise()
        for (const inst of instances.DBInstances || []) {
          const arn = inst.DBInstanceArn
          const id = inst.DBInstanceIdentifier
          if (!arn || !id) continue
          try {
          const tags = await rds.listTagsForResource({ ResourceName: arn }).promise()
          const tagList = tags.TagList || []
          const match = this.tagsArrayMatch(this.getCommonTags(), tagList)
            if (match) return { type: 'instance', id }
          } catch {}
        }
      } else {
        const clusters = await rds.describeDBClusters().promise()
        for (const cl of clusters.DBClusters || []) {
          const arn = cl.DBClusterArn
          const id = cl.DBClusterIdentifier
          if (!arn || !id) continue
          try {
          const tags = await rds.listTagsForResource({ ResourceName: arn }).promise()
          const tagList = tags.TagList || []
          const match = this.tagsArrayMatch(this.getCommonTags(), tagList)
            if (match) return { type: 'cluster', id }
          } catch {}
        }
      }
    } catch {}
    return null
  }

  private async shutdownRDS(environment: string): Promise<void> {
    const target = (await this.findRdsTargetByTag(environment)) || this.getRdsTarget(environment)
    try {
      if (target.type === 'instance') {
        await rds.stopDBInstance({ DBInstanceIdentifier: target.id }).promise()
        logger.info('RDS instance stopped', { instanceIdentifier: target.id })
      } else {
        await rds.stopDBCluster({ DBClusterIdentifier: target.id }).promise()
        logger.info('RDS cluster stopped', { clusterIdentifier: target.id })
      }
    } catch (error: any) {
      if (error.code === 'InvalidDBInstanceState' && target.type === 'instance') {
        logger.info('RDS instance already stopped', { instanceIdentifier: target.id })
        return
      }
      if (error.code === 'InvalidDBClusterStateFault' && target.type === 'cluster') {
        logger.info('RDS cluster already stopped', { clusterIdentifier: target.id })
        return
      }
      throw error
    }
  }

  private async startupRDS(environment: string): Promise<void> {
    const target = (await this.findRdsTargetByTag(environment)) || this.getRdsTarget(environment)
    try {
      if (target.type === 'instance') {
        await rds.startDBInstance({ DBInstanceIdentifier: target.id }).promise()
        logger.info('RDS instance started', { instanceIdentifier: target.id })
      } else {
        await rds.startDBCluster({ DBClusterIdentifier: target.id }).promise()
        logger.info('RDS cluster started', { clusterIdentifier: target.id })
      }
    } catch (error: any) {
      if (error.code === 'InvalidDBInstanceState' && target.type === 'instance') {
        logger.info('RDS instance already running', { instanceIdentifier: target.id })
        return
      }
      if (error.code === 'InvalidDBClusterStateFault' && target.type === 'cluster') {
        logger.info('RDS cluster already running', { clusterIdentifier: target.id })
        return
      }
      throw error
    }
  }

  private async getRDSStatus(environment: string): Promise<{ status: string; clusterId: string; message: string }> {
    const target = (await this.findRdsTargetByTag(environment)) || this.getRdsTarget(environment)
    try {
      if (target.type === 'instance') {
        const response = await rds.describeDBInstances({ DBInstanceIdentifier: target.id }).promise()
        if (response.DBInstances && response.DBInstances.length > 0) {
          const instance = response.DBInstances[0]
          return {
            status: instance.DBInstanceStatus || 'unknown',
            clusterId: instance.DBInstanceIdentifier || target.id,
            message: `Instance is ${instance.DBInstanceStatus}`
          }
        }
        return { status: 'not-found', clusterId: target.id, message: 'DB instance not found' }
      } else {
        const response = await rds.describeDBClusters({ DBClusterIdentifier: target.id }).promise()
        if (response.DBClusters && response.DBClusters.length > 0) {
          const cluster = response.DBClusters[0]
          return {
            status: cluster.Status || 'unknown',
            clusterId: cluster.DBClusterIdentifier || target.id,
            message: `Cluster is ${cluster.Status}`
          }
        }
        return { status: 'not-found', clusterId: target.id, message: 'Cluster not found' }
      }
    } catch (error: any) {
      return { status: 'error', clusterId: target.id, message: error.message }
    }
  }

  // ElastiCache Management Methods
  private async shutdownElastiCache(environment: string): Promise<void> {
    const replicationGroupId = (await this.findElasticacheByTag(environment)) || `${environment}-legitmark-redis-${this.region}`
    
    try {
      // For ElastiCache, we'll just log that we can't modify it this way
      logger.info('ElastiCache shutdown not implemented via API', { replicationGroupId })
      
      logger.info('ElastiCache replication group modified', { replicationGroupId })
    } catch (error: any) {
      if (error.code === 'InvalidReplicationGroupStateFault') {
        logger.info('ElastiCache already in desired state', { replicationGroupId })
      } else {
        throw error
      }
    }
  }

  private async startupElastiCache(environment: string): Promise<void> {
    const replicationGroupId = (await this.findElasticacheByTag(environment)) || `${environment}-legitmark-redis-${this.region}`
    
    try {
      // For ElastiCache startup, we'll just log that we can't modify it this way
      logger.info('ElastiCache startup not implemented via API', { replicationGroupId })
      
      logger.info('ElastiCache replication group modified', { replicationGroupId })
    } catch (error: any) {
      if (error.code === 'InvalidReplicationGroupStateFault') {
        logger.info('ElastiCache already in desired state', { replicationGroupId })
      } else {
        throw error
      }
    }
  }

  private async getElastiCacheStatus(environment: string): Promise<{ status: string; replicationGroupId: string; message: string }> {
    const replicationGroupId = (await this.findElasticacheByTag(environment)) || `${environment}-legitmark-redis-${this.region}`
    
    try {
      const response = await elasticache.describeReplicationGroups({
        ReplicationGroupId: replicationGroupId
      }).promise()
      
      if (response.ReplicationGroups && response.ReplicationGroups.length > 0) {
        const group = response.ReplicationGroups[0]
        return {
          status: group.Status || 'unknown',
          replicationGroupId: group.ReplicationGroupId || '',
          message: `Replication group is ${group.Status}`
        }
      }
      
      return { status: 'not-found', replicationGroupId, message: 'Replication group not found' }
    } catch (error: any) {
      return { status: 'error', replicationGroupId, message: error.message }
    }
  }

  private async findElasticacheByTag(environment: string): Promise<string | null> {
    try {
      const resp = await elasticache.describeReplicationGroups({}).promise()
      for (const g of resp.ReplicationGroups || []) {
        if (!g.ARN || !g.ReplicationGroupId) continue
        try {
          const tags = await elasticache.listTagsForResource({ ResourceName: g.ARN }).promise()
          const tagList = tags.TagList || []
          const match = this.tagsArrayMatch(this.getCommonTags(), tagList)
          if (match) return g.ReplicationGroupId
        } catch {}
      }
    } catch {}
    return null
  }

  // App Runner Management Methods
  private async findAppRunnerServiceByTags(environment: string): Promise<AWS.AppRunner.ServiceSummary | null> {
    try {
      const services = await apprunner.listServices().promise()
      for (const s of services.ServiceSummaryList || []) {
        const arn = s.ServiceArn
        if (!arn) continue
        try {
          const tags = await apprunner.listTagsForResource({ ResourceArn: arn }).promise()
          const tagList = tags.Tags || []
          const match = tagList.some(t => t.Key === 'Environment' && t.Value === environment) &&
                       tagList.some(t => t.Key === 'ManagedBy' && t.Value === 'terraform') &&
                       tagList.some(t => t.Key === 'Project' && t.Value === 'legitmark')
          if (match) return s
        } catch {}
      }
    } catch {}
    return null
  }
  private async shutdownAppRunner(environment: string): Promise<void> {
    const fallbackName = `${environment}-legitmark-service`
    try {
      const services = await apprunner.listServices().promise()
      const tagged = await this.findAppRunnerServiceByTags(environment)
      const service = tagged || services.ServiceSummaryList?.find(s => s.ServiceName === fallbackName)
      if (service && service.ServiceArn) {
        await apprunner.pauseService({
          ServiceArn: service.ServiceArn
        }).promise()
        logger.info('App Runner service paused', { serviceArn: service.ServiceArn })
      } else {
        logger.info('App Runner service not found', { fallbackName })
      }
    } catch (error: any) {
      throw error
    }
  }

  private async startupAppRunner(environment: string): Promise<void> {
    const fallbackName = `${environment}-legitmark-service`
    try {
      const services = await apprunner.listServices().promise()
      const tagged = await this.findAppRunnerServiceByTags(environment)
      const service = tagged || services.ServiceSummaryList?.find(s => s.ServiceName === fallbackName)
      if (service && service.ServiceArn) {
        await apprunner.resumeService({
          ServiceArn: service.ServiceArn
        }).promise()
        logger.info('App Runner service resumed', { serviceArn: service.ServiceArn })
      } else {
        logger.info('App Runner service not found', { fallbackName })
      }
    } catch (error: any) {
      throw error
    }
  }

  private async getAppRunnerStatus(environment: string): Promise<{ status: string; serviceArn: string; message: string }> {
    const fallbackName = `${environment}-legitmark-service`
    try {
      const services = await apprunner.listServices().promise()
      const tagged = await this.findAppRunnerServiceByTags(environment)
      const service = tagged || services.ServiceSummaryList?.find(s => s.ServiceName === fallbackName)
      if (service) {
        return {
          status: service.Status || 'unknown',
          serviceArn: service.ServiceArn || '',
          message: `Service is ${service.Status}`
        }
      }
      return { status: 'not-found', serviceArn: '', message: 'Service not found' }
    } catch (error: any) {
      return { status: 'error', serviceArn: '', message: error.message }
    }
  }

  // CloudFront Management Methods
  private async findCloudFrontDistributionsByTags(environment: string): Promise<AWS.CloudFront.DistributionSummary[]> {
    try {
      const list = await cloudfront.listDistributions({}).promise()
      const matches: AWS.CloudFront.DistributionSummary[] = []
      for (const dist of list.DistributionList?.Items || []) {
        const arn = dist.ARN
        if (!arn) continue
        try {
          const tags = await cloudfront.listTagsForResource({ Resource: arn }).promise()
          const tagList = (tags.Tags?.Items || []).map(t => ({ Key: t.Key, Value: t.Value }))
          if (this.tagsArrayMatch(this.getCommonTags(), tagList)) {
            matches.push(dist)
          }
        } catch {}
      }
      return matches
    } catch { return [] }
  }

  private async disableCloudFront(environment: string): Promise<void> {
    const dists = await this.findCloudFrontDistributionsByTags(environment)
    if (!dists.length) {
      logger.info('CloudFront distributions not found for environment')
      return
    }
    for (const dist of dists) {
      if (!dist.Id) continue
      await this.disableSingleCloudFront(dist.Id)
    }
  }

  private async enableCloudFront(environment: string): Promise<void> {
    const dists = await this.findCloudFrontDistributionsByTags(environment)
    if (!dists.length) {
      logger.info('CloudFront distributions not found for environment')
      return
    }
    for (const dist of dists) {
      if (!dist.Id) continue
      await this.enableSingleCloudFront(dist.Id)
    }
  }

  private async disableSingleCloudFront(id: string): Promise<void> {
    const cfg = await cloudfront.getDistributionConfig({ Id: id }).promise()
    const etag = cfg.ETag
    const config = cfg.DistributionConfig
    if (!config || !etag) return
    if (config.Enabled === false) {
      logger.info('CloudFront already disabled', { distributionId: id })
      return
    }
    config.Enabled = false
    await cloudfront.updateDistribution({ Id: id, IfMatch: etag, DistributionConfig: config }).promise()
    logger.info('CloudFront distribution disabled', { distributionId: id })
  }

  private async enableSingleCloudFront(id: string): Promise<void> {
    const cfg = await cloudfront.getDistributionConfig({ Id: id }).promise()
    const etag = cfg.ETag
    const config = cfg.DistributionConfig
    if (!config || !etag) return
    if (config.Enabled === true) {
      logger.info('CloudFront already enabled', { distributionId: id })
      return
    }
    config.Enabled = true
    await cloudfront.updateDistribution({ Id: id, IfMatch: etag, DistributionConfig: config }).promise()
    logger.info('CloudFront distribution enabled', { distributionId: id })
  }

  private async getCloudFrontStatus(environment: string): Promise<{ status: string; distributions: CloudFrontDistributionDetails[]; message: string }> {
    try {
      const dists = await this.findCloudFrontDistributionsByTags(environment)
      const details: CloudFrontDistributionDetails[] = dists.map(d => ({
        id: d.Id || '',
        arn: d.ARN,
        domainName: d.DomainName,
        aliases: d.Aliases?.Items || [],
        enabled: d.Enabled === true,
        status: d.Status,
        priceClass: d.PriceClass
      }))
      return { status: 'active', distributions: details, message: `${details.length} distributions found` }
    } catch (error: any) {
      return { status: 'error', distributions: [], message: error.message }
    }
  }

  // Lambda Management Methods
  private async getTaggedLambdaFunctions(environment: string): Promise<AWS.Lambda.FunctionConfiguration[]> {
    const matched: AWS.Lambda.FunctionConfiguration[] = []
    const list = await lambda.listFunctions().promise()
    for (const func of list.Functions || []) {
      const arn = func.FunctionArn
      if (!arn) continue
      try {
        const tagsResp = await lambda.listTags({ Resource: arn }).promise()
        const tags = tagsResp.Tags || {}
        if (this.tagsMapMatch(this.getCommonTags(), tags)) {
          matched.push(func)
        }
      } catch {}
    }
    return matched
  }
  private async shutdownLambda(environment: string): Promise<Record<string, boolean>> {
    try {
      const environmentFunctions = await this.getTaggedLambdaFunctions(environment)
      const results: Record<string, boolean> = {}
      
      for (const func of environmentFunctions) {
        if (this.isExcludedLambda(func)) continue
        if (!func.FunctionName || !func.FunctionArn) continue

        const functionName = func.FunctionName

        // 1) Read current reserved concurrency
        let currentReserved: number | null = null
        try {
          const rc = await lambda.getFunctionConcurrency({ FunctionName: functionName }).promise()
          currentReserved = typeof rc.ReservedConcurrentExecutions === 'number' ? rc.ReservedConcurrentExecutions : null
        } catch { results[functionName] = false }

        // 2) Persist previous reserved concurrency in a tag for restore
        try {
          const existingTags = await lambda.listTags({ Resource: func.FunctionArn }).promise()
          const tags = existingTags.Tags || {}
          // Save the previous state: either the number or 'unlimited' for null
          const tagValue = currentReserved === null ? 'unlimited' : String(currentReserved)
          if (tags['ResourceManagerPrevReservedConcurrency'] !== tagValue) {
            await lambda.tagResource({
              Resource: func.FunctionArn,
              Tags: { ResourceManagerPrevReservedConcurrency: tagValue }
            }).promise()
            logger.info('Saved previous concurrency state', { functionName, savedValue: tagValue })
          }
        } catch (e: any) {
          logger.warn('Failed to save concurrency tag', { functionName, error: e.message })
        }

        // 3) Set reserved concurrency to 0 to throttle
        try {
          await lambda.putFunctionConcurrency({ FunctionName: functionName, ReservedConcurrentExecutions: 0 }).promise()
          logger.info('Lambda reserved concurrency set to 0', { functionName })
        } catch (error: any) {
          logger.warn('Failed to set reserved concurrency to 0', { functionName, error: error.message })
          results[functionName] = false
        }

        // 4) Remove provisioned concurrency for all qualifiers (aliases and $LATEST)
        try {
          const aliases = await lambda.listAliases({ FunctionName: functionName }).promise()
          const qualifiers: string[] = ['$LATEST']
          for (const a of aliases.Aliases || []) {
            if (a.Name) qualifiers.push(a.Name)
          }
          for (const q of qualifiers) {
            try {
              await lambda.deleteProvisionedConcurrencyConfig({ FunctionName: functionName, Qualifier: q }).promise()
              logger.info('Removed provisioned concurrency', { functionName, qualifier: q })
            } catch {}
          }
        } catch {}

        if (!(functionName in results)) results[functionName] = true
      }
      return results
    } catch (error: any) {
      throw error
    }
  }

  private async startupLambda(environment: string): Promise<Record<string, boolean>> {
    try {
      const environmentFunctions = await this.getTaggedLambdaFunctions(environment)
      const results: Record<string, boolean> = {}
      
      for (const func of environmentFunctions) {
        if (this.isExcludedLambda(func)) continue
        if (!func.FunctionName || !func.FunctionArn) continue
        const functionName = func.FunctionName

        // Restore previous reserved concurrency if we saved it
        let restored = false
        try {
          const existingTags = await lambda.listTags({ Resource: func.FunctionArn }).promise()
          const prev = existingTags.Tags?.['ResourceManagerPrevReservedConcurrency']
          
          if (prev) {
            if (prev === 'unlimited') {
              // Restore to unlimited by removing any concurrency limit
              await lambda.deleteFunctionConcurrency({ FunctionName: functionName }).promise()
              logger.info('Restored to unlimited concurrency', { functionName })
              restored = true
            } else if (!isNaN(Number(prev)) && Number(prev) > 0) {
              // Restore to specific number
              await lambda.putFunctionConcurrency({ FunctionName: functionName, ReservedConcurrentExecutions: Number(prev) }).promise()
              logger.info('Restored reserved concurrency', { functionName, reserved: Number(prev) })
              restored = true
            }
            
            // Clean up the tag after restore
            if (restored) {
              try {
                await lambda.untagResource({ Resource: func.FunctionArn, TagKeys: ['ResourceManagerPrevReservedConcurrency'] }).promise()
              } catch (e: any) {
                logger.warn('Failed to clean up tag', { functionName, error: e.message })
              }
            }
          } else {
            logger.info('No previous concurrency tag found', { functionName })
          }
        } catch (e: any) {
          logger.error('Failed to restore concurrency', { functionName, error: e.message })
          results[functionName] = false
        }
        
        // If not restored and no tag found, assume it was unlimited before
        if (!restored && !results.hasOwnProperty(functionName)) {
          try {
            await lambda.deleteFunctionConcurrency({ FunctionName: functionName }).promise()
            logger.info('Restored to unlimited concurrency (no tag found)', { functionName })
            restored = true
          } catch (e: any) {
            logger.warn('Failed to remove concurrency limit', { functionName, error: e.message })
            results[functionName] = false
          }
        }

        if (!(functionName in results)) results[functionName] = true
      }
      return results
    } catch (error: any) {
      throw error
    }
  }

  private async getLambdaStatus(environment: string): Promise<{ status: string; functionCount: number; message: string; functions: LambdaFunctionDetails[] }> {
    try {
      const environmentFunctions = await this.getTaggedLambdaFunctions(environment)

      const functions: LambdaFunctionDetails[] = []
      for (const func of environmentFunctions) {
        if (!func.FunctionName || !func.FunctionArn) continue
        // Reserved concurrency
        let reserved: number | null = null
        try {
          const rc = await lambda.getFunctionConcurrency({ FunctionName: func.FunctionName }).promise()
          reserved = typeof rc.ReservedConcurrentExecutions === 'number' ? rc.ReservedConcurrentExecutions : null
        } catch {}

        // Provisioned concurrency (iterate qualifiers if any)
        const provisioned: ProvisionedConcurrencyDetail[] = []
        try {
          const cfg = await lambda.listAliases({ FunctionName: func.FunctionName }).promise()
          const qualifiers: string[] = ['$LATEST']
          for (const a of cfg.Aliases || []) {
            if (a.Name) qualifiers.push(a.Name)
          }
          for (const q of qualifiers) {
            try {
              const pc = await lambda.getProvisionedConcurrencyConfig({ FunctionName: func.FunctionName, Qualifier: q }).promise()
              provisioned.push({
                qualifier: q,
                allocated: pc.AllocatedProvisionedConcurrentExecutions || 0,
                requested: pc.RequestedProvisionedConcurrentExecutions || 0,
                status: pc.Status || 'UNKNOWN'
              })
            } catch {}
          }
        } catch {}

        functions.push({
          functionName: func.FunctionName,
          functionArn: func.FunctionArn,
          runtime: func.Runtime,
          memorySize: func.MemorySize,
          timeout: func.Timeout,
          lastModified: func.LastModified,
          version: func.Version,
          state: func.State,
          reservedConcurrentExecutions: reserved,
          provisionedConcurrency: provisioned
        })
      }

      return {
        status: 'active',
        functionCount: environmentFunctions.length,
        message: `${environmentFunctions.length} functions found`,
        functions
      }
    } catch (error: any) {
      return { status: 'error', functionCount: 0, message: error.message, functions: [] }
    }
  }

  // EC2 Management Methods
  private async shutdownEC2(environment: string): Promise<void> {
    try {
      const instances = await ec2.describeInstances({
        Filters: [
          ...this.buildEc2TagFilters(this.getCommonTags()),
          { Name: 'instance-state-name', Values: ['running', 'pending'] }
        ]
      }).promise()
      
      const instanceIds = instances.Reservations?.flatMap(r => 
        r.Instances?.map(i => i.InstanceId).filter((id): id is string => id !== undefined) || []
      ) || []
      
      if (instanceIds.length > 0) {
        await ec2.stopInstances({
          InstanceIds: instanceIds
        }).promise()
        
        logger.info('EC2 instances stopped', { instanceIds })
      } else {
        logger.info('No running EC2 instances found', { environment })
      }
    } catch (error: any) {
      throw error
    }
  }

  private async startupEC2(environment: string): Promise<void> {
    try {
      const instances = await ec2.describeInstances({
        Filters: [
          ...this.buildEc2TagFilters(this.getCommonTags()),
          { Name: 'instance-state-name', Values: ['stopped'] }
        ]
      }).promise()
      
      const instanceIds = instances.Reservations?.flatMap(r => 
        r.Instances?.map(i => i.InstanceId).filter((id): id is string => id !== undefined) || []
      ) || []
      
      if (instanceIds.length > 0) {
        await ec2.startInstances({
          InstanceIds: instanceIds
        }).promise()
        
        logger.info('EC2 instances started', { instanceIds })
      } else {
        logger.info('No stopped EC2 instances found', { environment })
      }
    } catch (error: any) {
      throw error
    }
  }

  private async getEC2Status(environment: string): Promise<{ status: string; instanceCount: number; message: string; instances: EC2InstanceDetails[] }> {
    try {
      const instances = await ec2.describeInstances({
        Filters: this.buildEc2TagFilters(this.getCommonTags())
      }).promise()
      
      const allInstances = instances.Reservations?.flatMap(r => r.Instances || []) || []
      const runningInstances = allInstances.filter(i => i.State?.Name === 'running')

      // Build account ID for ARN creation
      let accountId: string | undefined
      try {
        const ident = await sts.getCallerIdentity({}).promise()
        accountId = ident.Account
      } catch {}

      const instanceDetails: EC2InstanceDetails[] = allInstances.map(i => {
        const nameTag = (i.Tags || []).find(t => t.Key === 'Name')?.Value
        const securityGroupIds = (i.SecurityGroups || []).map(sg => sg.GroupId!).filter(Boolean)
        const arn = i.InstanceId && accountId ? `arn:aws:ec2:${this.region}:${accountId}:instance/${i.InstanceId}` : undefined
        return {
          instanceId: i.InstanceId || '',
          arn,
          name: nameTag,
          state: i.State?.Name,
          instanceType: i.InstanceType,
          publicIpAddress: i.PublicIpAddress,
          privateIpAddress: i.PrivateIpAddress,
          availabilityZone: i.Placement?.AvailabilityZone,
          vpcId: i.VpcId,
          subnetId: i.SubnetId,
          securityGroupIds,
          launchTime: i.LaunchTime?.toISOString(),
          platform: i.Platform,
          architecture: i.Architecture
        }
      })

      return {
        status: 'active',
        instanceCount: allInstances.length,
        message: `${runningInstances.length} running out of ${allInstances.length} total instances`,
        instances: instanceDetails
      }
    } catch (error: any) {
      return { status: 'error', instanceCount: 0, message: error.message, instances: [] }
    }
  }

  // Schedule Management Methods
  public async getSchedules(): Promise<any[]> {
    try {
      const response = await scheduler.listSchedules().promise()
      return response.Schedules || []
    } catch (error: any) {
      logger.error('Failed to get schedules', { error: error.message })
      throw error
    }
  }

  public async createSchedule(name: string, cron: string, action: string, environment: string): Promise<any> {
    try {
      const response = await scheduler.createSchedule({
        Name: name,
        ScheduleExpression: cron,
        Target: {
          Arn: process.env.LAMBDA_FUNCTION_ARN || '',
          RoleArn: process.env.LAMBDA_ROLE_ARN || '',
          Input: JSON.stringify({ action, environment })
        },
        FlexibleTimeWindow: {
          Mode: 'OFF'
        }
      }).promise()
      
      return response
    } catch (error: any) {
      logger.error('Failed to create schedule', { error: error.message })
      throw error
    }
  }

  public async deleteSchedule(id: string): Promise<void> {
    try {
      await scheduler.deleteSchedule({
        Name: id
      }).promise()
    } catch (error: any) {
      logger.error('Failed to delete schedule', { error: error.message })
      throw error
    }
  }

  // CloudWatch Management Methods
  /**
   * Analyze CloudWatch log groups and provide cost analysis
   */
  public async analyzeCloudWatchCosts(region?: string): Promise<CloudWatchCostAnalysis> {
    const targetRegion = region || this.region
    logger.info('Analyzing CloudWatch costs', { component: 'service', action: 'cloudwatch-analysis', region: targetRegion })

    try {
      // Create a new CloudWatch Logs client for the specific region
      const regionCloudWatchLogs = new AWS.CloudWatchLogs({ region: targetRegion })

      const logGroups = await this.getAllLogGroups(regionCloudWatchLogs)
      const costAnalysis = this.calculateCloudWatchCosts(logGroups)

      return costAnalysis
    } catch (error: any) {
      logger.error('CloudWatch cost analysis failed', { 
        component: 'service', 
        action: 'cloudwatch-analysis',
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  /**
   * Get all log groups with their details
   */
  private async getAllLogGroups(client?: AWS.CloudWatchLogs): Promise<CloudWatchLogGroup[]> {
    const cloudWatchLogsClient = client || cloudwatchLogs
    const logGroups: CloudWatchLogGroup[] = []
    let nextToken: string | undefined

    do {
      const response = await cloudWatchLogsClient.describeLogGroups({
        nextToken
      }).promise()

      for (const logGroup of response.logGroups || []) {
        // Get metric filters count
        let metricFilterCount = 0
        try {
          const filters = await cloudWatchLogsClient.describeMetricFilters({
            logGroupName: logGroup.logGroupName
          }).promise()
          metricFilterCount = filters.metricFilters?.length || 0
        } catch {}

        logGroups.push({
          logGroupName: logGroup.logGroupName || '',
          storedBytes: logGroup.storedBytes || 0,
          retentionInDays: logGroup.retentionInDays,
          creationTime: logGroup.creationTime,
          metricFilterCount,
          arn: logGroup.arn
        })
      }

      nextToken = response.nextToken
    } while (nextToken)

    return logGroups
  }

  /**
   * Calculate CloudWatch costs based on log groups
   */
  private calculateCloudWatchCosts(logGroups: CloudWatchLogGroup[]): CloudWatchCostAnalysis {
    const costs = {
      logIngestion: 0,
      logStorage: 0,
      s3Egress: 0,
      alarms: 0,
      metrics: 0
    }

    const recommendations = {
      potentialSavings: 0,
      actions: [] as string[]
    }

    // Calculate costs based on AWS pricing (US East 2)
    const pricing = {
      logIngestion: 0.50, // $0.50 per GB
      logStorage: 0.03,   // $0.03 per GB-month
      s3Egress: 0.25,     // $0.25 per GB
      alarms: 0.10,       // $0.10 per alarm per month
      metrics: 0.30       // $0.30 per metric per month
    }

    // Analyze log groups
    const noRetentionGroups = logGroups.filter(lg => !lg.retentionInDays)
    const highVolumeGroups = logGroups.filter(lg => lg.storedBytes > 1000000000) // > 1GB

    // Calculate storage costs (monthly)
    for (const logGroup of logGroups) {
      const gb = logGroup.storedBytes / (1024 * 1024 * 1024)
      costs.logStorage += gb * pricing.logStorage
    }

    // Estimate ingestion costs (assuming 10x storage for monthly ingestion)
    for (const logGroup of logGroups) {
      const gb = logGroup.storedBytes / (1024 * 1024 * 1024)
      costs.logIngestion += gb * 10 * pricing.logIngestion // Estimate 10x monthly ingestion
    }

    // Calculate potential savings from retention policies
    for (const logGroup of noRetentionGroups) {
      const gb = logGroup.storedBytes / (1024 * 1024 * 1024)
      const monthlySavings = gb * pricing.logStorage
      recommendations.potentialSavings += monthlySavings
    }

    // Generate recommendations
    if (noRetentionGroups.length > 0) {
      recommendations.actions.push(`Set retention policies for ${noRetentionGroups.length} log groups with no retention`)
    }

    if (highVolumeGroups.length > 0) {
      recommendations.actions.push(`Review high-volume log groups: ${highVolumeGroups.map(lg => lg.logGroupName).join(', ')}`)
    }

    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0)

    return {
      totalCost,
      breakdown: costs,
      recommendations,
      logGroups: logGroups.sort((a, b) => b.storedBytes - a.storedBytes)
    }
  }

  /**
   * Apply optimized retention policies to log groups
   */
  public async optimizeCloudWatchLogs(region?: string): Promise<CloudWatchOptimizationResult> {
    const targetRegion = region || this.region
    logger.info('Optimizing CloudWatch logs', { component: 'service', action: 'cloudwatch-optimization', region: targetRegion })

    try {
      // Create a new CloudWatch Logs client for the specific region
      const regionCloudWatchLogs = new AWS.CloudWatchLogs({ region: targetRegion })

      const result: CloudWatchOptimizationResult = {
        success: true,
        appliedRetentionPolicies: 0,
        estimatedMonthlySavings: 0,
        errors: [],
        details: []
      }

      const logGroups = await this.getAllLogGroups(regionCloudWatchLogs)
      const optimizationRules = this.getOptimizationRules()

      for (const logGroup of logGroups) {
        try {
          const rule = this.getRetentionRule(logGroup.logGroupName, optimizationRules)
          if (rule && (!logGroup.retentionInDays || logGroup.retentionInDays > rule.retentionDays)) {
            await regionCloudWatchLogs.putRetentionPolicy({
              logGroupName: logGroup.logGroupName,
              retentionInDays: rule.retentionDays
            }).promise()

            const gb = logGroup.storedBytes / (1024 * 1024 * 1024)
            const monthlySavings = gb * 0.03 // $0.03 per GB-month

            result.details.push({
              logGroupName: logGroup.logGroupName,
              previousRetention: logGroup.retentionInDays,
              newRetention: rule.retentionDays,
              estimatedSavings: monthlySavings
            })

            result.appliedRetentionPolicies++
            result.estimatedMonthlySavings += monthlySavings

            logger.info('Applied retention policy', {
              logGroupName: logGroup.logGroupName,
              retentionDays: rule.retentionDays,
              estimatedSavings: monthlySavings
            })
          }
        } catch (error: any) {
          result.errors.push(`${logGroup.logGroupName}: ${error.message}`)
          logger.error('Failed to apply retention policy', {
            logGroupName: logGroup.logGroupName,
            error: error.message
          })
        }
      }

      if (result.errors.length > 0) {
        result.success = false
      }

      logger.info('CloudWatch optimization completed', {
        appliedPolicies: result.appliedRetentionPolicies,
        estimatedSavings: result.estimatedMonthlySavings,
        errors: result.errors.length
      })

      return result
    } catch (error: any) {
      logger.error('CloudWatch optimization failed', { 
        component: 'service', 
        action: 'cloudwatch-optimization',
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  /**
   * Get optimization rules for different log group types
   */
  private getOptimizationRules() {
    return {
      // Production logs - 14 days
      production: {
        patterns: ['prod-', 'production-'],
        retentionDays: 14,
        description: 'Production logs'
      },
      // Staging logs - 7 days
      staging: {
        patterns: ['staging-', 'stage-'],
        retentionDays: 7,
        description: 'Staging logs'
      },
      // Development logs - 3 days
      development: {
        patterns: ['dev-', 'development-'],
        retentionDays: 3,
        description: 'Development logs'
      },
      // WAF logs - 30 days (security compliance)
      waf: {
        patterns: ['waf-', 'aws-waf-logs'],
        retentionDays: 30,
        description: 'WAF security logs'
      },
      // CloudTrail logs - 30 days (compliance)
      cloudtrail: {
        patterns: ['cloudtrail', 'aws-cloudtrail'],
        retentionDays: 30,
        description: 'CloudTrail audit logs'
      },
      // RDS error logs - 7 days
      rds: {
        patterns: ['/aws/rds/', 'rds-'],
        retentionDays: 7,
        description: 'RDS error logs'
      },
      // Lambda logs - 3 days for most, 7 days for critical
      lambda: {
        patterns: ['/aws/lambda/'],
        retentionDays: 3,
        description: 'Lambda function logs'
      },
      // CodeBuild logs - 3 days
      codebuild: {
        patterns: ['/aws/codebuild/'],
        retentionDays: 3,
        description: 'CodeBuild logs'
      },
      // Default - 7 days
      default: {
        patterns: [],
        retentionDays: 7,
        description: 'Default retention'
      }
    }
  }

  /**
   * Get retention rule for a log group
   */
  private getRetentionRule(logGroupName: string, rules: any) {
    const lowerName = logGroupName.toLowerCase()
    
    for (const [key, rule] of Object.entries(rules)) {
      if (key === 'default') continue
      
      const typedRule = rule as any
      for (const pattern of typedRule.patterns) {
        if (lowerName.includes(pattern.toLowerCase())) {
          return typedRule
        }
      }
    }
    
    return rules.default
  }

  /**
   * Get CloudWatch alarms for a region
   */
  public async getCloudWatchAlarms(region?: string): Promise<any[]> {
    const targetRegion = region || this.region
    logger.info('Getting CloudWatch alarms', { component: 'service', action: 'get-alarms', region: targetRegion })

    try {
      // Validate region format
      if (!targetRegion || !/^[a-z0-9-]+$/.test(targetRegion)) {
        throw new Error(`Invalid region format: ${targetRegion}`)
      }

      // Create a new CloudWatch client for the specific region
      const regionCloudWatch = new AWS.CloudWatch({ region: targetRegion })
      
      logger.info('CloudWatch client created for region', { region: targetRegion })
      
      const response = await regionCloudWatch.describeAlarms().promise()
      
      logger.info('Successfully retrieved CloudWatch alarms', { 
        region: targetRegion, 
        alarmCount: response.MetricAlarms?.length || 0 
      })
      
      return response.MetricAlarms || []
    } catch (error: any) {
      logger.error('Failed to get CloudWatch alarms', { 
        component: 'service', 
        action: 'get-alarms',
        region: targetRegion,
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      // Provide more specific error messages
      if (error.code === 'SignatureDoesNotMatch') {
        throw new Error(`AWS credentials not valid for region ${targetRegion}. Please check if your credentials support this region.`)
      } else if (error.code === 'AccessDenied') {
        throw new Error(`Access denied to CloudWatch in region ${targetRegion}. Please check IAM permissions.`)
      } else if (error.code === 'InvalidParameterValue') {
        throw new Error(`Invalid region parameter: ${targetRegion}`)
      }
      
      throw error
    }
  }

  // S3 Management Methods
  /**
   * Analyze S3 buckets and provide cost analysis
   */
  public async analyzeS3Costs(region?: string): Promise<S3CostAnalysis> {
    const targetRegion = region || this.region
    logger.info('Analyzing S3 costs', { component: 'service', action: 's3-analysis', region: targetRegion })

    try {
      // Create a new S3 client for the specific region
      const regionS3 = new AWS.S3({ region: targetRegion })
      
      const buckets = await this.getAllS3Buckets(regionS3, targetRegion)
      const costAnalysis = this.calculateS3Costs(buckets)
      const recommendations = this.generateS3Recommendations(buckets)

      return {
        totalCost: costAnalysis.totalCost,
        breakdown: costAnalysis.breakdown,
        buckets,
        recommendations
      }
    } catch (error: any) {
      logger.error('S3 cost analysis failed', { 
        component: 'service', 
        action: 's3-analysis',
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  /**
   * Apply optimized configurations to S3 buckets
   */
  public async optimizeS3Buckets(region?: string): Promise<S3OptimizationResult> {
    const targetRegion = region || this.region
    logger.info('Optimizing S3 buckets', { component: 'service', action: 's3-optimization', region: targetRegion })

    try {
      // Create a new S3 client for the specific region
      const regionS3 = new AWS.S3({ region: targetRegion })
      
      const result: S3OptimizationResult = {
        success: true,
        appliedOptimizations: 0,
        estimatedMonthlySavings: 0,
        errors: [],
        details: []
      }

      const buckets = await this.getAllS3Buckets(regionS3, targetRegion)
      const optimizationRules = this.getS3OptimizationRules()

      for (const bucket of buckets) {
        try {
          const rule = this.getS3OptimizationRule(bucket.bucketName, optimizationRules)
          if (rule) {
            // Apply lifecycle policy if needed
            if (rule.lifecyclePolicy && !bucket.hasLifecyclePolicy) {
              await this.applyLifecyclePolicy(regionS3, bucket.bucketName, rule.lifecyclePolicy)
              result.appliedOptimizations++
              result.estimatedMonthlySavings += rule.estimatedSavings || 0
              result.details.push({
                bucketName: bucket.bucketName,
                action: 'Applied lifecycle policy',
                configuration: rule.lifecyclePolicy,
                estimatedSavings: rule.estimatedSavings || 0
              })
            }

            // Apply intelligent tiering if needed
            if (rule.intelligentTiering && !bucket.hasIntelligentTiering) {
              await this.applyIntelligentTiering(regionS3, bucket.bucketName, rule.intelligentTiering)
              result.appliedOptimizations++
              result.estimatedMonthlySavings += rule.estimatedSavings || 0
              result.details.push({
                bucketName: bucket.bucketName,
                action: 'Applied intelligent tiering',
                configuration: rule.intelligentTiering,
                estimatedSavings: rule.estimatedSavings || 0
              })
            }
          }
        } catch (error: any) {
          const errorMsg = `Failed to optimize bucket ${bucket.bucketName}: ${error.message}`
          result.errors.push(errorMsg)
          logger.error('S3 bucket optimization failed', { 
            component: 'service', 
            action: 's3-optimization',
            bucketName: bucket.bucketName,
            error: error instanceof Error ? error : new Error(String(error))
          })
        }
      }

      return result
    } catch (error: any) {
      logger.error('S3 optimization failed', { 
        component: 'service', 
        action: 's3-optimization',
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  /**
   * Get all S3 buckets with their details
   */
  private async getAllS3Buckets(s3Client: AWS.S3, region: string): Promise<S3BucketAnalysis[]> {
    const buckets: S3BucketAnalysis[] = []
    
    try {
      const response = await s3Client.listBuckets().promise()
      
      for (const bucket of response.Buckets || []) {
        if (!bucket.Name) continue
        
        try {
          // Get bucket location
          const locationResponse = await s3Client.getBucketLocation({ Bucket: bucket.Name }).promise()
          const bucketRegion = locationResponse.LocationConstraint === 'us-east-1' ? 'us-east-1' : locationResponse.LocationConstraint || 'us-east-1'
          
          // Only analyze buckets in the target region
          if (bucketRegion !== region) continue
          
          // Get bucket size and object count
          const { totalSize, objectCount } = await this.getBucketSizeAndCount(s3Client, bucket.Name)
          
          // Check for lifecycle policy
          let hasLifecyclePolicy = false
          try {
            await s3Client.getBucketLifecycleConfiguration({ Bucket: bucket.Name }).promise()
            hasLifecyclePolicy = true
          } catch {
            hasLifecyclePolicy = false
          }
          
          // Check for intelligent tiering
          let hasIntelligentTiering = false
          try {
            await s3Client.getBucketIntelligentTieringConfiguration({ 
              Bucket: bucket.Name, 
              Id: 'EntireBucket' 
            }).promise()
            hasIntelligentTiering = true
          } catch {
            hasIntelligentTiering = false
          }
          
          // Calculate estimated monthly cost
          const estimatedMonthlyCost = this.calculateBucketMonthlyCost(totalSize, objectCount)
          
          buckets.push({
            bucketName: bucket.Name,
            region: bucketRegion,
            totalSize,
            objectCount,
            storageClass: 'STANDARD',
            hasLifecyclePolicy,
            hasIntelligentTiering,
            estimatedMonthlyCost,
            lastModified: bucket.CreationDate
          })
        } catch (error) {
          logger.warn('Failed to analyze bucket', { 
            component: 'service', 
            bucketName: bucket.Name,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
    } catch (error) {
      logger.error('Failed to list S3 buckets', { 
        component: 'service', 
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
    
    return buckets
  }

  /**
   * Get bucket size and object count
   */
  private async getBucketSizeAndCount(s3Client: AWS.S3, bucketName: string): Promise<{ totalSize: number, objectCount: number }> {
    let totalSize = 0
    let objectCount = 0
    let continuationToken: string | undefined

    do {
      try {
        const response = await s3Client.listObjectsV2({
          Bucket: bucketName,
          ContinuationToken: continuationToken
        }).promise()

        for (const object of response.Contents || []) {
          totalSize += object.Size || 0
          objectCount++
        }

        continuationToken = response.NextContinuationToken
      } catch (error) {
        logger.warn('Failed to list objects in bucket', { 
          component: 'service', 
          bucketName,
          error: error instanceof Error ? error.message : String(error)
        })
        break
      }
    } while (continuationToken)

    return { totalSize, objectCount }
  }

  /**
   * Calculate bucket monthly cost
   */
  private calculateBucketMonthlyCost(sizeBytes: number, objectCount: number): number {
    const sizeGB = sizeBytes / (1024 * 1024 * 1024)
    const storageCost = sizeGB * 0.023 // $0.023 per GB per month
    const requestCost = (objectCount * 0.0004) / 10000 // $0.0004 per 10,000 requests
    return storageCost + requestCost
  }

  /**
   * Calculate S3 costs
   */
  private calculateS3Costs(buckets: S3BucketAnalysis[]): { totalCost: number, breakdown: any } {
    let totalCost = 0
    let standardStorage = 0
    let intelligentTiering = 0
    let requests = 0
    let dataTransfer = 0

    for (const bucket of buckets) {
      totalCost += bucket.estimatedMonthlyCost
      standardStorage += bucket.estimatedMonthlyCost * 0.8 // Assume 80% storage cost
      requests += bucket.estimatedMonthlyCost * 0.1 // Assume 10% request cost
      dataTransfer += bucket.estimatedMonthlyCost * 0.1 // Assume 10% transfer cost
    }

    return {
      totalCost,
      breakdown: {
        standardStorage,
        intelligentTiering,
        requests,
        dataTransfer
      }
    }
  }

  /**
   * Generate S3 optimization recommendations
   */
  private generateS3Recommendations(buckets: S3BucketAnalysis[]): Array<{
    bucketName: string
    recommendation: string
    estimatedSavings: number
    priority: 'high' | 'medium' | 'low'
  }> {
    const recommendations: Array<{
      bucketName: string
      recommendation: string
      estimatedSavings: number
      priority: 'high' | 'medium' | 'low'
    }> = []

    for (const bucket of buckets) {
      // High priority: Large buckets without lifecycle policies
      if (bucket.totalSize > 100 * 1024 * 1024 * 1024 && !bucket.hasLifecyclePolicy) { // > 100GB
        recommendations.push({
          bucketName: bucket.bucketName,
          recommendation: 'Apply lifecycle policy to transition old objects to cheaper storage classes',
          estimatedSavings: bucket.estimatedMonthlyCost * 0.3,
          priority: 'high'
        })
      }

      // Medium priority: Buckets without intelligent tiering
      if (bucket.totalSize > 10 * 1024 * 1024 * 1024 && !bucket.hasIntelligentTiering) { // > 10GB
        recommendations.push({
          bucketName: bucket.bucketName,
          recommendation: 'Enable S3 Intelligent Tiering for automatic cost optimization',
          estimatedSavings: bucket.estimatedMonthlyCost * 0.15,
          priority: 'medium'
        })
      }

      // Low priority: All buckets
      if (!bucket.hasLifecyclePolicy) {
        recommendations.push({
          bucketName: bucket.bucketName,
          recommendation: 'Consider implementing lifecycle policies for cost optimization',
          estimatedSavings: bucket.estimatedMonthlyCost * 0.1,
          priority: 'low'
        })
      }
    }

    return recommendations
  }

  /**
   * Get S3 optimization rules
   */
  private getS3OptimizationRules() {
    return {
      // Media buckets - apply lifecycle and intelligent tiering
      media: {
        patterns: ['media', 'cdn', 'assets'],
        lifecyclePolicy: {
          Rules: [{
            ID: 'MediaLifecycleRule',
            Status: 'Enabled',
            Transitions: [
              {
                Days: 30,
                StorageClass: 'STANDARD_IA'
              },
              {
                Days: 90,
                StorageClass: 'GLACIER'
              }
            ]
          }]
        },
        intelligentTiering: {
          Id: 'EntireBucket',
          Status: 'Enabled'
        },
        estimatedSavings: 0.3
      },
      // Log buckets - aggressive lifecycle
      logs: {
        patterns: ['logs', 'log'],
        lifecyclePolicy: {
          Rules: [{
            ID: 'LogLifecycleRule',
            Status: 'Enabled',
            Expiration: {
              Days: 30
            }
          }]
        },
        estimatedSavings: 0.5
      },
      // Backup buckets - glacier transition
      backups: {
        patterns: ['backup', 'backups'],
        lifecyclePolicy: {
          Rules: [{
            ID: 'BackupLifecycleRule',
            Status: 'Enabled',
            Transitions: [
              {
                Days: 1,
                StorageClass: 'GLACIER'
              }
            ]
          }]
        },
        estimatedSavings: 0.7
      }
    }
  }

  /**
   * Get optimization rule for bucket
   */
  private getS3OptimizationRule(bucketName: string, rules: any) {
    for (const [ruleName, rule] of Object.entries(rules)) {
      const ruleObj = rule as any
      for (const pattern of ruleObj.patterns) {
        if (bucketName.toLowerCase().includes(pattern.toLowerCase())) {
          return ruleObj
        }
      }
    }
    return null
  }

  /**
   * Apply lifecycle policy to bucket
   */
  private async applyLifecyclePolicy(s3Client: AWS.S3, bucketName: string, lifecyclePolicy: any): Promise<void> {
    await s3Client.putBucketLifecycleConfiguration({
      Bucket: bucketName,
      LifecycleConfiguration: lifecyclePolicy
    }).promise()
  }

  /**
   * Apply intelligent tiering to bucket
   */
  private async applyIntelligentTiering(s3Client: AWS.S3, bucketName: string, intelligentTiering: any): Promise<void> {
    await s3Client.putBucketIntelligentTieringConfiguration({
      Bucket: bucketName,
      Id: intelligentTiering.Id,
      IntelligentTieringConfiguration: intelligentTiering
    }).promise()
  }

  /**
   * Format currency amount to human-readable format
   */
  private formatCurrency(amount: number): string {
    if (amount < 0.01) {
      return '< $0.01'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Format CloudWatch cost analysis to human-readable format
   */
  public formatCloudWatchCosts(analysis: CloudWatchCostAnalysis): any {
    return {
      totalCost: this.formatCurrency(analysis.totalCost),
      breakdown: {
        logIngestion: this.formatCurrency(analysis.breakdown.logIngestion),
        logStorage: this.formatCurrency(analysis.breakdown.logStorage),
        s3Egress: this.formatCurrency(analysis.breakdown.s3Egress),
        alarms: this.formatCurrency(analysis.breakdown.alarms),
        metrics: this.formatCurrency(analysis.breakdown.metrics)
      },
      recommendations: {
        potentialSavings: this.formatCurrency(analysis.recommendations.potentialSavings),
        actions: analysis.recommendations.actions
      },
      logGroups: analysis.logGroups.map(lg => ({
        logGroupName: lg.logGroupName,
        storedBytes: this.formatBytes(lg.storedBytes),
        storedBytesRaw: lg.storedBytes,
        retentionInDays: lg.retentionInDays || 'Never',
        metricFilterCount: lg.metricFilterCount,
        arn: lg.arn
      }))
    }
  }

  /**
   * Format S3 cost analysis to human-readable format
   */
  public formatS3Costs(analysis: S3CostAnalysis): any {
    return {
      totalCost: this.formatCurrency(analysis.totalCost),
      breakdown: {
        standardStorage: this.formatCurrency(analysis.breakdown.standardStorage),
        intelligentTiering: this.formatCurrency(analysis.breakdown.intelligentTiering),
        requests: this.formatCurrency(analysis.breakdown.requests),
        dataTransfer: this.formatCurrency(analysis.breakdown.dataTransfer)
      },
      buckets: analysis.buckets.map(bucket => ({
        bucketName: bucket.bucketName,
        region: bucket.region,
        totalSize: this.formatBytes(bucket.totalSize),
        totalSizeRaw: bucket.totalSize,
        objectCount: bucket.objectCount.toLocaleString(),
        objectCountRaw: bucket.objectCount,
        storageClass: bucket.storageClass,
        hasLifecyclePolicy: bucket.hasLifecyclePolicy,
        hasIntelligentTiering: bucket.hasIntelligentTiering,
        estimatedMonthlyCost: this.formatCurrency(bucket.estimatedMonthlyCost),
        estimatedMonthlyCostRaw: bucket.estimatedMonthlyCost,
        lastModified: bucket.lastModified
      })),
      recommendations: analysis.recommendations.map(rec => ({
        bucketName: rec.bucketName,
        recommendation: rec.recommendation,
        estimatedSavings: this.formatCurrency(rec.estimatedSavings),
        estimatedSavingsRaw: rec.estimatedSavings,
        priority: rec.priority
      }))
    }
  }

  /**
   * Get formatted CloudWatch cost analysis
   */
  public async getFormattedCloudWatchCosts(region?: string): Promise<any> {
    const analysis = await this.analyzeCloudWatchCosts(region)
    return this.formatCloudWatchCosts(analysis)
  }

  /**
   * Get formatted S3 cost analysis
   */
  public async getFormattedS3Costs(region?: string): Promise<any> {
    const analysis = await this.analyzeS3Costs(region)
    return this.formatS3Costs(analysis)
  }
}
