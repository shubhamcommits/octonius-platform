import AWSXRay from 'aws-xray-sdk'

// X-Ray Express middleware
export const xray_express = {
  openSegment: (name: string) => {
    return AWSXRay.express.openSegment(name)
  },
  closeSegment: () => {
    return AWSXRay.express.closeSegment()
  }
}

// X-Ray capture for AWS SDK
export const captureAWS = AWSXRay.captureAWS(require('aws-sdk'))
