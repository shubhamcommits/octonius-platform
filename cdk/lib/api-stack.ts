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
        const hostedZone = route53.HostedZone.fromLookup(this, 'octonius_hosted_zone', {
            domainName: props.domain_name
        })

        // Create SSL certificate
        const certificate = new acm.Certificate(this, 'octonius_certificate', {
            domainName: `api.${props.domain_name}`,
            validation: acm.CertificateValidation.fromDns(hostedZone)
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
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                    'X-Amz-User-Agent'
                ],
                maxAge: cdk.Duration.days(1)
            }
        })

        // Add tags for cost allocation
        if (props?.tags) {
            Object.entries(props.tags).forEach(([key, value]) => cdk.Tags.of(this.api).add(key, value as string))
        }
    }
} 