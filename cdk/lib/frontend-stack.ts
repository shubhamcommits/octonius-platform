// Import CDK core library
import * as cdk from 'aws-cdk-lib'

// Import S3 constructs
import * as s3 from 'aws-cdk-lib/aws-s3'

// Import CloudFront constructs
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'

// Import CloudFront Origins constructs
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'

// Import Certificate Manager constructs
import * as acm from 'aws-cdk-lib/aws-certificatemanager'

// Import Route53 constructs
import * as route53 from 'aws-cdk-lib/aws-route53'

// Import Route53 Targets constructs
import * as targets from 'aws-cdk-lib/aws-route53-targets'

// Import Construct base class
import { Construct } from 'constructs'


// Define interface for FrontendStack props
interface FrontendStackProps extends cdk.StackProps {
    domain_name: string
    tags?: Record<string, string>
}


// Define FrontendStack class
export class FrontendStack extends cdk.Stack {
    // Public properties for the frontend resources
    public readonly bucket: s3.Bucket
    public readonly distribution: cloudfront.Distribution


    // Constructor for the FrontendStack
    constructor(scope: Construct, id: string, props: FrontendStackProps) {
        super(scope, id, props)

        // Create hosted zone reference
        const hostedZone = route53.HostedZone.fromLookup(this, 'octonius_frontend_hosted_zone', {
            domainName: props.domain_name
        })

        // Create SSL certificate
        const certificate = new acm.Certificate(this, 'octonius_frontend_certificate', {
            domainName: props.domain_name,
            validation: acm.CertificateValidation.fromDns(hostedZone)
        })

        // Create S3 bucket for frontend assets
        this.bucket = new s3.Bucket(this, 'octonius_frontend_bucket', {
            bucketName: `octonius-frontend-${this.account}-${this.region}`,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            encryption: s3.BucketEncryption.S3_MANAGED,
            versioned: true,
            cors: [
                {
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.HEAD
                    ],
                    allowedOrigins: [`https://${props.domain_name}`],
                    allowedHeaders: ['*'],
                    maxAge: 3000
                }
            ]
        })

        // Create CloudFront distribution
        this.distribution = new cloudfront.Distribution(this, 'octonius_frontend_distribution', {
            defaultBehavior: {
                origin: new origins.S3Origin(this.bucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
                responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS
            },
            domainNames: [props.domain_name],
            certificate: certificate,
            defaultRootObject: 'index.html',
            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html'
                }
            ],
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
            geoRestriction: cloudfront.GeoRestriction.allowlist('DE', 'FR', 'GB', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'GR', 'HR', 'SI')
        })

        // Create DNS record
        new route53.ARecord(this, 'octonius_frontend_dns', {
            zone: hostedZone,
            target: route53.RecordTarget.fromAlias(
                new targets.CloudFrontTarget(this.distribution)
            ),
            recordName: props.domain_name
        })

        // Add tags for cost allocation
        if (props?.tags) {
            Object.entries(props.tags).forEach(([key, value]) => {
                cdk.Tags.of(this.bucket).add(key, value as string)
                cdk.Tags.of(this.distribution).add(key, value as string)
            })
        }
    }
} 