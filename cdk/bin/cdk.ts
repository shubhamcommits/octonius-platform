#!/usr/bin/env node

// Import source map support for better debugging
import 'source-map-support/register'

// Import CDK core library
import * as cdk from 'aws-cdk-lib'

// Import main stack
import { MainStack } from '../lib/main-stack'

// DotEnv Module - Only load in local environment
if (process.env.NODE_ENV === 'local') {
    const dotenv = require('dotenv')
    dotenv.config()
}

// Validate required environment variables
const required_env_vars = ['AWS_ACCOUNT_ID', 'AWS_REGION', 'NODE_ENV', 'APP_NAME']
const missing_env_vars = required_env_vars.filter(envVar => !process.env[envVar])

if (missing_env_vars.length > 0) {
    throw new Error(`Missing required environment variables: ${missing_env_vars.join(', ')}`)
}

// Initialize CDK app
const app = new cdk.App()

// Define regions to deploy to
const region = process.env.AWS_REGION || 'eu-central-1'
console.log(`Deploying to region: ${region}`)

// Define common tags
const COMMON_TAGS = {
    Environment: process.env.NODE_ENV!,
    Project: process.env.APP_NAME!,
    Owner: process.env.OWNER || 'Octonius Team',
    ManagedBy: 'CDK'
}

// Define base stack name
const baseStackName = `${process.env.NODE_ENV}-${process.env.APP_NAME}`
console.log(`Base stack name: ${baseStackName}`)

// Get account ID
const accountId = process.env.AWS_ACCOUNT_ID
console.log(`Account ID: ${accountId}`)

// Create main stack
const stack = new MainStack(app, baseStackName, {
    env: {
        account: accountId,
        region: region
    },
    tags: {
        ...COMMON_TAGS,
        Region: region
    }
})

// Output app configuration
console.log('CDK App Configuration:')
console.log(JSON.stringify({
    region,
    baseStackName,
    accountId,
    tags: COMMON_TAGS
}, null, 2))

// Synthesize the stack
console.log('Synthesizing stack...')
const synth = app.synth()
console.log('Stack synthesis complete')

// Output stack details
console.log('Stack details:')
console.log(JSON.stringify({
    stackName: stack.stackName,
    stackId: stack.stackId,
    region: stack.region,
    account: stack.account,
    environment: stack.environment
}, null, 2)) 