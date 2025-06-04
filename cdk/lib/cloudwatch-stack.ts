// Import CDK core library
import * as cdk from 'aws-cdk-lib'

// Import AWS constructs
import * as logs from 'aws-cdk-lib/aws-logs'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as iam from 'aws-cdk-lib/aws-iam'

// Import Construct base class
import { Construct } from 'constructs'


// Define CloudWatchStack class
export class CloudWatchStack extends cdk.Stack {
    // Public properties for the CloudWatch resources
    public readonly log_group: logs.LogGroup
    public readonly dashboard: cloudwatch.Dashboard


    // Constructor for the CloudWatchStack
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        // Create log group
        this.log_group = new logs.LogGroup(this, 'logs', {
            logGroupName: '/octonius/application',
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.RETAIN
        })

        // Create CloudWatch dashboard
        this.dashboard = new cloudwatch.Dashboard(this, 'dashboard', {
            dashboardName: 'Octonius-Metrics'
        })

        // Add CPU utilization widget
        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'CPU Utilization',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/ECS',
                        metricName: 'CPUUtilization',
                        dimensionsMap: {
                            ClusterName: 'OctoniusCluster'
                        },
                        statistic: 'Average',
                        period: cdk.Duration.minutes(5)
                    })
                ]
            })
        )

        // Add memory utilization widget
        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'Memory Utilization',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/ECS',
                        metricName: 'MemoryUtilization',
                        dimensionsMap: {
                            ClusterName: 'OctoniusCluster'
                        },
                        statistic: 'Average',
                        period: cdk.Duration.minutes(5)
                    })
                ]
            })
        )
    }
} 