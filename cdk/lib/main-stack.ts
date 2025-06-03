import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

// Import existing stacks
import { VpcStack } from './vpc-stack'
import { S3Stack } from './s3-stack'
import { CloudWatchStack } from './cloudwatch-stack'

export class MainStack extends cdk.Stack {
  // Stack properties
  private vpc_stack?: VpcStack
  private s3_stack?: S3Stack
  private cloudwatch_stack?: CloudWatchStack
  private domain_name: string

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    console.log(`Initializing MainStack with ID: ${id}`)
    console.log(`Stack properties:`, props)

    // Define the 'env' parameter
    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      default: `${process.env.NODE_ENV}`,
      allowedValues: ['dev', 'prod', 'staging'],
    })

    // Validate domain name
    if (!process.env.DOMAIN_NAME) {
      throw new Error('DOMAIN_NAME environment variable is required')
    }
    this.domain_name = process.env.DOMAIN_NAME

    // Initialize stacks based on region
    const region = props?.env?.region
    console.log(`Deploying to region: ${region}`)

    // Create VPC and subnets
    this.initializeVpcStack(props)

    // Create S3 bucket
    this.initializeS3Stack(props)

    // Create CloudWatch stack
    this.initializeCloudWatchStack(props)

    // Set up dependencies
    this.setupDependencies()

    // Output stack information
    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'The name of the stack',
    })

    new cdk.CfnOutput(this, 'Region', {
      value: region || 'unknown',
      description: 'The region where the stack is deployed',
    })
  }

  /**
   * Initialize VPC stack
   */
  private initializeVpcStack(props?: cdk.StackProps) {
    console.log('Initializing VPC stack...')
    this.vpc_stack = new VpcStack(this, `${process.env.NODE_ENV}-${process.env.APP_NAME}-vpc`, {
      env: props?.env,
      tags: props?.tags
    })
    console.log('VPC stack initialized successfully')
  }

  /**
   * Initialize S3 stack
   */
  private initializeS3Stack(props?: cdk.StackProps) {
    console.log('Initializing S3 stack...')
    this.s3_stack = new S3Stack(this, `${process.env.NODE_ENV}-${process.env.APP_NAME}-s3`, {
      env: props?.env,
      tags: props?.tags
    })
    console.log('S3 stack initialized successfully')
  }

  /**
   * Initialize CloudWatch stack
   */
  private initializeCloudWatchStack(props?: cdk.StackProps) {
    console.log('Initializing CloudWatch stack...')
    this.cloudwatch_stack = new CloudWatchStack(this, `${process.env.NODE_ENV}-${process.env.APP_NAME}-cloudwatch`, {
      env: props?.env,
      tags: props?.tags
    })
    console.log('CloudWatch stack initialized successfully')
  }

  /**
   * Set up dependencies between stacks
   */
  private setupDependencies() {
    console.log('Setting up stack dependencies...')
    if (!this.vpc_stack || !this.s3_stack || !this.cloudwatch_stack) {
      throw new Error('All required stacks must be initialized before setting up dependencies')
    }

    // Add basic dependencies
    this.s3_stack.addDependency(this.vpc_stack)
    this.cloudwatch_stack.addDependency(this.vpc_stack)
    console.log('Stack dependencies set up successfully')
  }
} 