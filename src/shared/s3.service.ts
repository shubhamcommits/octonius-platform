import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import logger from '../logger'
import { getEnv } from '../config'

const { AWS_DEFAULT_REGION, S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, CDN_BASE_URL } = getEnv()

interface UploadIntent {
    uploadUrl: string
    fileKey: string
    bucket: string
    expiresIn: number
}

interface DownloadIntent {
    downloadUrl: string
    expiresIn: number
}

export class S3Service {
    private s3Client: S3Client
    private bucketName: string

    constructor() {
        this.bucketName = S3_BUCKET_NAME
        
        this.s3Client = new S3Client({
            region: AWS_DEFAULT_REGION || 'us-east-1',
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID || '',
                secretAccessKey: AWS_SECRET_ACCESS_KEY || ''
            }
        })
    }

    /**
     * Generate a presigned URL for file upload
     * @param fileName - Original file name
     * @param fileType - MIME type of the file
     * @param userId - User ID for folder organization
     * @param workplaceId - Workplace ID for folder organization
     * @param expiresIn - URL expiration time in seconds (default: 15 minutes)
     * @returns Upload intent with presigned URL and file key
     */
    async createUploadIntent(
        fileName: string, 
        fileType: string, 
        userId: string, 
        workplaceId: string,
        expiresIn: number = 900 // 15 minutes
    ): Promise<UploadIntent> {
        try {
            // Generate unique file key with organized folder structure
            const fileExtension = fileName.split('.').pop() || ''
            const uniqueFileName = `${uuidv4()}.${fileExtension}`
            const fileKey = `workplaces/${workplaceId}/files/${uniqueFileName}`

            // Create the put object command
            const putObjectCommand = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
                ContentType: fileType,
                Metadata: {
                    'original-name': fileName,
                    'user-id': userId,
                    'workplace-id': workplaceId,
                    'uploaded-at': new Date().toISOString()
                }
            })

            // Generate presigned URL
            const uploadUrl = await getSignedUrl(this.s3Client, putObjectCommand, { 
                expiresIn 
            })

            logger.info('S3 upload intent created', { 
                fileKey, 
                fileName, 
                fileType, 
                userId, 
                workplaceId,
                expiresIn 
            })

            return {
                uploadUrl,
                fileKey,
                bucket: this.bucketName,
                expiresIn
            }
        } catch (error) {
            logger.error('Failed to create S3 upload intent', { 
                error, 
                fileName, 
                fileType, 
                userId, 
                workplaceId 
            })
            throw new Error('Failed to create upload intent')
        }
    }

    /**
     * Generate a presigned URL for file download
     * @param fileKey - S3 file key
     * @param expiresIn - URL expiration time in seconds (default: 1 hour)
     * @returns Download intent with presigned URL
     */
    async createDownloadIntent(fileKey: string, expiresIn: number = 3600): Promise<DownloadIntent> {
        try {
            const getObjectCommand = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey
            })

            const downloadUrl = await getSignedUrl(this.s3Client, getObjectCommand, { 
                expiresIn 
            })

            logger.info('S3 download intent created', { fileKey, expiresIn })

            return {
                downloadUrl,
                expiresIn
            }
        } catch (error) {
            logger.error('Failed to create S3 download intent', { error, fileKey })
            throw new Error('Failed to create download intent')
        }
    }

    /**
     * Delete a file from S3
     * @param fileKey - S3 file key to delete
     */
    async deleteFile(fileKey: string): Promise<void> {
        try {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey
            })

            await this.s3Client.send(deleteCommand)
            logger.info('File deleted from S3', { fileKey })
        } catch (error) {
            logger.error('Failed to delete file from S3', { error, fileKey })
            throw new Error('Failed to delete file')
        }
    }

    /**
     * Get CDN URL for a file (served through CloudFront/CDN)
     * @param fileKey - S3 file key
     * @returns CDN URL
     */
    getCDNUrl(fileKey: string): string {
        return `${CDN_BASE_URL}/${fileKey}`
    }

    /**
     * Extract file info from S3 file key
     * @param fileKey - S3 file key
     * @returns File info object
     */
    parseFileKey(fileKey: string): { workplaceId: string; userId: string; fileName: string } | null {
        try {
            // Parse: workplaces/{workplaceId}/users/{userId}/files/{fileName}
            const parts = fileKey.split('/')
            if (parts.length >= 5 && parts[0] === 'workplaces' && parts[2] === 'users' && parts[4] === 'files') {
                return {
                    workplaceId: parts[1],
                    userId: parts[3],
                    fileName: parts[5]
                }
            }
            return null
        } catch (error) {
            logger.warn('Failed to parse S3 file key', { fileKey, error })
            return null
        }
    }
} 