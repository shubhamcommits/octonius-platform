#!/usr/bin/env node

// Import source map support for better debugging
import 'source-map-support/register'

// Import CDK core library
import * as cdk from 'aws-cdk-lib'

// Import stack definitions
import { VpcStack } from '../lib/vpc-stack'
import { DatabaseStack } from '../lib/database-stack'
import { RedisStack } from '../lib/redis-stack'
import { EcsStack } from '../lib/ecs-stack'
import { ApiStack } from '../lib/api-stack'
import { FrontendStack } from '../lib/frontend-stack'
import { MediaStack } from '../lib/media-stack'

// DotEnv Module - Only load in local environment
if (process.env.NODE_ENV === 'local') {
    const dotenv = require('dotenv')
    dotenv.config()
}

// Initialize CDK app
const app = new cdk.App()

// Define regions to deploy to
const regions = ['eu-central-1']

// Define common tags
const COMMON_TAGS = {
    Environment: process.env.NODE_ENV || 'Production',
    Project: process.env.APP_NAME || 'Octonius',
    Owner: process.env.OWNER || 'Octonius Team',
    ManagedBy: 'CDK'
}

// For each region create the stacks
regions.forEach(region => {
    // Define base stack name
    const baseStackName = `${process.env.NODE_ENV}-${process.env.APP_NAME}`

    // Create VPC stack
    const vpc_stack = new VpcStack(app, `${baseStackName}-vpc-${region}`, {
        env: {
            account: process.env.AWS_ACCOUNT_NUMBER,
            region: region
        },
        tags: {
            ...COMMON_TAGS,
            Region: region
        }
    })

    // Create Database stack
    const database_stack = new DatabaseStack(app, `${baseStackName}-database-${region}`, {
        vpc: vpc_stack.vpc,
        env: {
            account: process.env.AWS_ACCOUNT_NUMBER,
            region: region
        },
        tags: {
            ...COMMON_TAGS,
            Region: region
        }
    })

    // Create Redis stack
    const redis_stack = new RedisStack(app, `${baseStackName}-redis-${region}`, {
        vpc: vpc_stack.vpc,
        env: {
            account: process.env.AWS_ACCOUNT_NUMBER,
            region: region
        },
        tags: {
            ...COMMON_TAGS,
            Region: region
        }
    })

    // Create ECS stack
    const ecs_stack = new EcsStack(app, `${baseStackName}-ecs-${region}`, {
        vpc: vpc_stack.vpc,
        env: {
            account: process.env.AWS_ACCOUNT_NUMBER,
            region: region
        },
        tags: {
            ...COMMON_TAGS,
            Region: region
        }
    })

    // Create API stack
    const api_stack = new ApiStack(app, `${baseStackName}-api-${region}`, {
        vpc: vpc_stack.vpc,
        domain_name: process.env.DOMAIN_NAME || 'octonius.example.com',
        env: {
            account: process.env.AWS_ACCOUNT_NUMBER,
            region: region
        },
        tags: {
            ...COMMON_TAGS,
            Region: region
        }
    })

    // Create Frontend stack
    const frontend_stack = new FrontendStack(app, `${baseStackName}-frontend-${region}`, {
        domain_name: process.env.DOMAIN_NAME || 'octonius.example.com',
        env: {
            account: process.env.AWS_ACCOUNT_NUMBER,
            region: region
        },
        tags: {
            ...COMMON_TAGS,
            Region: region
        }
    })

    // Create Media stack
    const media_stack = new MediaStack(app, `${baseStackName}-media-${region}`, {
        domain_name: process.env.DOMAIN_NAME || 'octonius.example.com',
        env: {
            account: process.env.AWS_ACCOUNT_NUMBER,
            region: region
        },
        tags: {
            ...COMMON_TAGS,
            Region: region
        }
    })

    // Add stack dependencies
    database_stack.addDependency(vpc_stack)
    redis_stack.addDependency(vpc_stack)
    ecs_stack.addDependency(vpc_stack)
    api_stack.addDependency(vpc_stack)
    api_stack.addDependency(ecs_stack)
    frontend_stack.addDependency(api_stack)
    media_stack.addDependency(api_stack)
}) 