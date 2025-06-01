// Import CDK core library
import * as cdk from 'aws-cdk-lib'

// Import API Gateway constructs
import * as apigateway from 'aws-cdk-lib/aws-apigateway'

// Import VPC constructs
import * as ec2 from 'aws-cdk-lib/aws-ec2'

// Import Certificate Manager constructs
import * as acm from 'aws-cdk-lib/aws-certificatemanager'

// Import Route53 constructs
import * as route53 from 'aws-cdk-lib/aws-route53'

// Import WAF constructs
import * as wafv2 from 'aws-cdk-lib/aws-wafv2'

// Import Construct base class
import { Construct } from 'constructs'


// Define interface for ApiStack props
interface ApiStackProps extends cdk.StackProps {
    vpc: ec2.Vpc
    domain_name: string
}


// Define ApiStack class
export class ApiStack extends cdk.Stack {
    // Public property for the API Gateway
    public readonly api: apigateway.RestApi


    // Constructor for the ApiStack
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props)

        // Create hosted zone reference
        const hostedZone = route53.HostedZone.fromLookup(this, 'octonius_api_hosted_zone', {
            domainName: props.domain_name
        })

        // Create SSL certificate
        const certificate = new acm.Certificate(this, 'octonius_api_certificate', {
            domainName: `api.${props.domain_name}`,
            validation: acm.CertificateValidation.fromDns(hostedZone)
        })

        // Create WAF WebACL
        const webAcl = new wafv2.CfnWebACL(this, 'octonius_api_waf', {
            defaultAction: { allow: {} },
            scope: 'REGIONAL',
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'octonius-api-waf',
                sampledRequestsEnabled: true
            },
            rules: [
                {
                    name: 'RateLimit',
                    priority: 1,
                    statement: {
                        rateBasedStatement: {
                            limit: 2000,
                            aggregateKeyType: 'IP'
                        }
                    },
                    action: { block: {} },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'RateLimit',
                        sampledRequestsEnabled: true
                    }
                },
                {
                    name: 'AWSManagedRulesCommonRuleSet',
                    priority: 2,
                    overrideAction: { none: {} },
                    statement: {
                        managedRuleGroupStatement: {
                            vendorName: 'AWS',
                            name: 'AWSManagedRulesCommonRuleSet'
                        }
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'AWSManagedRulesCommonRuleSet',
                        sampledRequestsEnabled: true
                    }
                }
            ]
        })

        // Create API Gateway
        this.api = new apigateway.RestApi(this, 'octonius_api', {
            restApiName: 'Octonius API',
            description: 'API Gateway for Octonius platform',
            deployOptions: {
                stageName: 'prod',
                metricsEnabled: true,
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
                tracingEnabled: true,
                cacheClusterEnabled: true,
                cacheClusterSize: '0.5',
                throttlingRateLimit: 10000,
                throttlingBurstLimit: 5000
            },
            domainName: {
                domainName: `api.${props.domain_name}`,
                certificate: certificate,
                endpointType: apigateway.EndpointType.REGIONAL,
                securityPolicy: apigateway.SecurityPolicy.TLS_1_2
            },
            defaultCorsPreflightOptions: {
                allowOrigins: [
                    `https://${props.domain_name}`,
                    `https://www.${props.domain_name}`
                ],
                allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                    'X-Amz-User-Agent'
                ],
                maxAge: cdk.Duration.days(1)
            },
            minimumCompressionSize: 1024,
            endpointTypes: [apigateway.EndpointType.REGIONAL]
        })

        // Associate WAF WebACL with API Gateway stage
        new wafv2.CfnWebACLAssociation(this, 'octonius_api_waf_association', {
            resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${this.api.restApiId}/stages/${this.api.deploymentStage.stageName}`,
            webAclArn: webAcl.attrArn
        })

        // Create API key and usage plan
        const apiKey = new apigateway.ApiKey(this, 'octonius_api_key', {
            enabled: true,
            description: 'API key for Octonius API'
        })

        const usagePlan = new apigateway.UsagePlan(this, 'octonius_usage_plan', {
            name: 'OctoniusUsagePlan',
            apiStages: [{
                api: this.api,
                stage: this.api.deploymentStage
            }],
            throttle: {
                rateLimit: 10,
                burstLimit: 20
            },
            quota: {
                limit: 10000,
                period: apigateway.Period.MONTH
            }
        })

        usagePlan.addApiKey(apiKey)

        // Add request validator
        const requestValidator = new apigateway.RequestValidator(this, 'octonius_request_validator', {
            restApi: this.api,
            validateRequestBody: true,
            validateRequestParameters: true
        })

        // Add tags for cost allocation
        if (props?.tags) {
            Object.entries(props.tags).forEach(([key, value]) => cdk.Tags.of(this.api).add(key, value as string))
        }
    }
} 