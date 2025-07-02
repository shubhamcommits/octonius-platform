import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
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
     * Generate a presigned URL for file upload with smart folder organization
     */
    async createUploadIntent(
        fileName: string, 
        fileType: string, 
        userId: string, 
        workplaceId: string,
        groupId?: string,
        fileCategory?: 'avatar' | 'logo' | 'private' | 'document' | null,
        expiresIn: number = 900 // 15 minutes
    ): Promise<UploadIntent> {
        try {
            // Generate unique file key with smart folder organization
            const fileExtension = fileName.split('.').pop()?.toLowerCase() || ''
            const uniqueFileName = `${uuidv4()}.${fileExtension}`
            
            // Smart folder structure based on usage
            let folder: string
            if (fileCategory === 'avatar' && !groupId) {
                folder = `users/${userId}/avatar`
            } else if (fileCategory === 'avatar' && groupId) {
                folder = `workplaces/${workplaceId}/groups/${groupId}/avatar`
            } else if (fileCategory === 'logo') {
                folder = `workplaces/${workplaceId}/branding`
            } else if (fileCategory === 'private' || (!groupId && !fileCategory)) {
                folder = `workplaces/${workplaceId}/users/${userId}/files`
            } else if (groupId) {
                folder = `workplaces/${workplaceId}/groups/${groupId}/files`
            } else {
                folder = `workplaces/${workplaceId}/files`
            }

            // Add subfolders based on file type for better organization
            if (fileCategory !== 'avatar' && fileCategory !== 'logo') {
                if (fileType.startsWith('image/')) {
                    folder += '/images'
                } else if (fileType.startsWith('video/')) {
                    folder += '/videos'
                } else if (fileType.startsWith('audio/')) {
                    folder += '/audio'
                } else if (fileType === 'application/pdf' || fileType.includes('document') || fileType.includes('text')) {
                    folder += '/documents'
                }
            }

            const fileKey = `${folder}/${uniqueFileName}`

            // Create the put object command
            const putObjectCommand = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
                ContentType: fileType,
                Metadata: {
                    'original-name': fileName,
                    'user-id': userId,
                    'workplace-id': workplaceId,
                    'group-id': groupId || '',
                    'category': fileCategory || 'file',
                    'uploaded-at': new Date().toISOString(),
                    'file-extension': fileExtension
                }
            })

            // Generate presigned URL
            const uploadUrl = await getSignedUrl(this.s3Client, putObjectCommand, { 
                expiresIn 
            })

            logger.info('S3 upload intent created', { 
                fileKey,
                folder, 
                fileName, 
                fileType, 
                userId, 
                workplaceId,
                groupId,
                fileCategory,
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
                workplaceId,
                groupId,
                fileCategory
            })
            throw new Error('Failed to create upload intent')
        }
    }

    /**
     * Check if a file exists in S3
     * @param fileKey - S3 file key
     * @returns True if file exists, false otherwise
     */
    async fileExists(fileKey: string): Promise<boolean> {
        try {
            const headCommand = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey
            })

            await this.s3Client.send(headCommand)
            return true
        } catch (error: any) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                return false
            }
            // For other errors, log and return false
            logger.warn('Error checking file existence in S3', { fileKey, error: error.message })
            return false
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
            // First check if file exists
            const exists = await this.fileExists(fileKey)
            if (!exists) {
                logger.error('File does not exist in S3', { 
                    fileKey, 
                    bucket: this.bucketName 
                })
                throw new Error(`File not found in S3: ${fileKey}`)
            }

            const getObjectCommand = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey
            })

            const downloadUrl = await getSignedUrl(this.s3Client, getObjectCommand, { 
                expiresIn 
            })

            logger.info('S3 download intent created', { 
                fileKey, 
                bucket: this.bucketName,
                expiresIn,
                urlPrefix: downloadUrl.substring(0, 100) + '...'
            })

            return {
                downloadUrl,
                expiresIn
            }
        } catch (error: any) {
            logger.error('Failed to create S3 download intent', { 
                error: error.message,
                fileKey,
                bucket: this.bucketName
            })
            throw new Error(`Failed to create download intent: ${error.message}`)
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
        // If already a full URL, return as is
        if (fileKey.startsWith('http')) {
            return fileKey;
        }
        
        // Remove leading slash if present
        const cleanKey = fileKey.startsWith('/') ? fileKey.substring(1) : fileKey;
        
        return `${CDN_BASE_URL}/${cleanKey}`;
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