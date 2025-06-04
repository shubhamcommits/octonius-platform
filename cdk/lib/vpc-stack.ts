// Import CDK core library
import * as cdk from 'aws-cdk-lib'

// Import VPC constructs
import * as ec2 from 'aws-cdk-lib/aws-ec2'

// Import Construct base class
import { Construct } from 'constructs'


// Define VpcStack class
export class VpcStack extends cdk.Stack {
    // Public property for the VPC resource
    public readonly vpc: ec2.Vpc


    // Constructor for the VpcStack
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        // Create the VPC with 2 AZs, public and private subnets
        this.vpc = new ec2.Vpc(this, 'vpc', {
            // Maximum number of availability zones to use
            maxAzs: 2,

            // VPC name
            vpcName: `${process.env.NODE_ENV}-${process.env.APP_NAME}-vpc`,

            // Subnet configuration array
            subnetConfiguration: [
                {
                    // Name of the public subnet group
                    name: 'public',

                    // Subnet type: public
                    subnetType: ec2.SubnetType.PUBLIC,

                    // CIDR mask for public subnets
                    cidrMask: 24
                },
                {
                    // Name of the private subnet group
                    name: 'private',

                    // Subnet type: private with egress
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,

                    // CIDR mask for private subnets
                    cidrMask: 24
                }
            ],

            // Enable DNS hostnames for the VPC
            enableDnsHostnames: true,

            // Enable DNS support for the VPC
            enableDnsSupport: true,

            // Number of NAT gateways (1 for cost efficiency)
            natGateways: 1,

            // VPC CIDR block
            ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')
        })

        // Add tags for cost allocation
        if (props?.tags) {
            Object.entries(props.tags).forEach(([key, value]) => cdk.Tags.of(this.vpc).add(key, value as string))
        }
    }
} 