// Import CDK core library
import * as cdk from 'aws-cdk-lib'

// Import ElastiCache constructs
import * as elasticache from 'aws-cdk-lib/aws-elasticache'

// Import VPC constructs
import * as ec2 from 'aws-cdk-lib/aws-ec2'

// Import Construct base class
import { Construct } from 'constructs'


// Define interface for RedisStack props
interface RedisStackProps extends cdk.StackProps {
    vpc: ec2.Vpc
}


// Define RedisStack class
export class RedisStack extends cdk.Stack {
    // Public property for the Redis cluster
    public readonly cluster: elasticache.CfnCacheCluster


    // Constructor for the RedisStack
    constructor(scope: Construct, id: string, props: RedisStackProps) {
        super(scope, id, props)

        // Create security group for Redis
        const redisSecurityGroup = new ec2.SecurityGroup(this, 'octonius_redis_sg', {
            vpc: props.vpc,
            description: 'Security group for Octonius Redis cluster',
            allowAllOutbound: true
        })

        // Allow inbound Redis traffic from ECS tasks
        redisSecurityGroup.addIngressRule(
            ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
            ec2.Port.tcp(6379),
            'Allow Redis access from within VPC'
        )

        // Create Redis subnet group
        const subnetGroup = new elasticache.CfnSubnetGroup(this, 'octonius_redis_subnet_group', {
            description: 'Subnet group for Octonius Redis cluster',
            subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId)
        })

        // Create Redis cluster
        this.cluster = new elasticache.CfnCacheCluster(this, 'octonius_redis', {
            engine: 'redis',
            cacheNodeType: 'cache.t3.micro',
            numCacheNodes: 1,
            port: 6379,
            vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
            cacheSubnetGroupName: subnetGroup.ref,
            engineVersion: '7.0',
            autoMinorVersionUpgrade: true,
            transitEncryptionEnabled: true,
            cacheParameterGroupName: 'default.redis7'
        })

        // Add tags for cost allocation
        if (props?.tags) {
            Object.entries(props.tags).forEach(([key, value]) => cdk.Tags.of(this.cluster).add(key, value as string))
        }
    }
} 