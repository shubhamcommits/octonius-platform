import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Vpc, SecurityGroup, Peer, Port, SubnetType } from 'aws-cdk-lib/aws-ec2'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { CfnSubnetGroup } from 'aws-cdk-lib/aws-elasticache'
import { LambdaIntegration } from 'aws-cdk-lib/aws-apigateway'
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications'
import { EventType } from 'aws-cdk-lib/aws-s3'

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
    if (props?.env?.region === 'eu-central-1') {
      // Create VPC and subnets
      this.initializeVpcStack(props)

      // Create S3 bucket
      this.initializeS3Stack(props)

      // Create CloudWatch stack
      this.initializeCloudWatchStack(props)

      // Set up dependencies
      this.setupDependencies()
    }
  }

  /**
   * Initialize VPC stack
   */
  private initializeVpcStack(props?: cdk.StackProps) {
    this.vpc_stack = new VpcStack(this, `${process.env.NODE_ENV}-${process.env.APP_NAME}-vpc`, {
      env: props?.env,
      tags: props?.tags
    })
  }

  /**
   * Initialize S3 stack
   */
  private initializeS3Stack(props?: cdk.StackProps) {
    this.s3_stack = new S3Stack(this, `${process.env.NODE_ENV}-${process.env.APP_NAME}-s3`, {
      env: props?.env,
      tags: props?.tags
    })
  }

  /**
   * Initialize CloudWatch stack
   */
  private initializeCloudWatchStack(props?: cdk.StackProps) {
    this.cloudwatch_stack = new CloudWatchStack(this, `${process.env.NODE_ENV}-${process.env.APP_NAME}-cloudwatch`, {
      env: props?.env,
      tags: props?.tags
    })
  }

  /**
   * Set up dependencies between stacks
   */
  private setupDependencies() {
    if (!this.vpc_stack || !this.s3_stack || !this.cloudwatch_stack) {
      throw new Error('All required stacks must be initialized before setting up dependencies')
    }

    // Add basic dependencies
    this.s3_stack.addDependency(this.vpc_stack)
    this.cloudwatch_stack.addDependency(this.vpc_stack)
  }
} 