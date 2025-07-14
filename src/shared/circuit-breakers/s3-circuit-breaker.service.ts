import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { circuitBreakerService, CIRCUIT_BREAKER_CONFIGS, type CircuitBreakerStats } from './circuit-breaker.service';
import { appLogger } from '../../logger';
import { getEnv } from '../../config';

const { AWS_DEFAULT_REGION, S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, CDN_BASE_URL } = getEnv();

interface UploadIntent {
    uploadUrl: string;
    fileKey: string;
    bucket: string;
    expiresIn: number;
}

export class S3CircuitBreakerService {
    private s3Client: S3Client;
    private bucketName: string;
    private s3UploadBreaker: any;
    private s3DownloadBreaker: any;
    private s3DeleteBreaker: any;
    private s3PresignBreaker: any;

    constructor() {
        this.bucketName = S3_BUCKET_NAME;
        
        this.s3Client = new S3Client({
            region: AWS_DEFAULT_REGION || 'us-east-1',
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID || '',
                secretAccessKey: AWS_SECRET_ACCESS_KEY || ''
            }
        });

        this.initializeCircuitBreakers();
    }

    private initializeCircuitBreakers() {
        // S3 Upload Operations Circuit Breaker
        this.s3UploadBreaker = circuitBreakerService.createBreaker(
            this.executeS3Upload.bind(this),
            {
                ...CIRCUIT_BREAKER_CONFIGS.AWS_S3,
                name: 'S3_UPLOAD',
                fallback: () => {
                    throw new Error('S3 upload service temporarily unavailable. Please try again later.');
                }
            }
        );

        // S3 Download Operations Circuit Breaker
        this.s3DownloadBreaker = circuitBreakerService.createBreaker(
            this.executeS3Download.bind(this),
            {
                ...CIRCUIT_BREAKER_CONFIGS.AWS_S3,
                name: 'S3_DOWNLOAD',
                fallback: () => {
                    throw new Error('S3 download service temporarily unavailable. Please try again later.');
                }
            }
        );

        // S3 Delete Operations Circuit Breaker
        this.s3DeleteBreaker = circuitBreakerService.createBreaker(
            this.executeS3Delete.bind(this),
            {
                ...CIRCUIT_BREAKER_CONFIGS.AWS_S3,
                name: 'S3_DELETE',
                fallback: () => {
                    appLogger('S3 delete operation failed, operation will be retried later', { level: 'warn' });
                    return false;
                }
            }
        );

        // S3 Presign Operations Circuit Breaker
        this.s3PresignBreaker = circuitBreakerService.createBreaker(
            this.executeS3Presign.bind(this),
            {
                ...CIRCUIT_BREAKER_CONFIGS.AWS_S3,
                name: 'S3_PRESIGN',
                timeout: 5000, // Shorter timeout for presign operations
                fallback: () => {
                    throw new Error('File upload service temporarily unavailable. Please try again later.');
                }
            }
        );
    }

    /**
     * Upload file to S3 with circuit breaker protection
     */
    async uploadToS3(bucket: string, key: string, body: Buffer, contentType?: string): Promise<boolean> {
        try {
            await this.s3UploadBreaker.fire({ bucket, key, body, contentType });
            return true;
        } catch (error) {
            appLogger('S3 upload failed through circuit breaker', {
                level: 'error',
                bucket,
                key,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Download file from S3 with circuit breaker protection
     */
    async downloadFromS3(bucket: string, key: string): Promise<Buffer | null> {
        try {
            return await this.s3DownloadBreaker.fire({ bucket, key });
        } catch (error) {
            appLogger('S3 download failed through circuit breaker', {
                level: 'error',
                bucket,
                key,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Delete file from S3 with circuit breaker protection
     */
    async deleteFromS3(bucket: string, key: string): Promise<boolean> {
        try {
            return await this.s3DeleteBreaker.fire({ bucket, key });
        } catch (error) {
            appLogger('S3 delete failed through circuit breaker', {
                level: 'error',
                bucket,
                key,
                error: error instanceof Error ? error.message : String(error)
            });
            return false; // Don't throw for delete operations, just return false
        }
    }

    /**
     * Create presigned URL with circuit breaker protection
     */
    async createUploadIntent(
        fileName: string,
        fileType: string,
        userId: string,
        workplaceId: string,
        groupId?: string,
        fileCategory?: 'avatar' | 'logo' | 'private' | 'document' | null,
        expiresIn: number = 900
    ): Promise<UploadIntent> {
        try {
            return await this.s3PresignBreaker.fire({
                fileName,
                fileType,
                userId,
                workplaceId,
                groupId,
                fileCategory,
                expiresIn
            });
        } catch (error) {
            appLogger('S3 presign failed through circuit breaker', {
                level: 'error',
                fileName,
                fileType,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Get CDN URL for a file
     */
    getCDNUrl(fileKey: string): string {
        return `${CDN_BASE_URL}/${fileKey}`;
    }

    // Private methods for actual S3 operations
    private async executeS3Upload({ bucket, key, body, contentType }: { bucket: string; key: string; body: Buffer; contentType?: string }): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType
        });

        await this.s3Client.send(command);
        appLogger('S3 upload successful', { bucket, key });
    }

    private async executeS3Download({ bucket, key }: { bucket: string; key: string }): Promise<Buffer | null> {
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key
        });

        const response = await this.s3Client.send(command);
        if (!response.Body) {
            return null;
        }

        const stream = response.Body as any;
        const chunks: Buffer[] = [];

        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        appLogger('S3 download successful', { bucket, key });
        return Buffer.concat(chunks);
    }

    private async executeS3Delete({ bucket, key }: { bucket: string; key: string }): Promise<boolean> {
        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        });

        await this.s3Client.send(command);
        appLogger('S3 delete successful', { bucket, key });
        return true;
    }

    private async executeS3Presign({
        fileName,
        fileType,
        userId,
        workplaceId,
        groupId,
        fileCategory,
        expiresIn
    }: {
        fileName: string;
        fileType: string;
        userId: string;
        workplaceId: string;
        groupId?: string;
        fileCategory?: string | null;
        expiresIn: number;
    }): Promise<UploadIntent> {
        const { v4: uuidv4 } = require('uuid');
        
        // Generate unique file key with smart folder organization
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        
        // Smart folder structure based on usage
        let folder: string;
        if (fileCategory === 'avatar' && !groupId) {
            folder = `users/${userId}/avatar`;
        } else if (fileCategory === 'avatar' && groupId) {
            folder = `workplaces/${workplaceId}/groups/${groupId}/avatar`;
        } else if (fileCategory === 'logo') {
            folder = `workplaces/${workplaceId}/branding`;
        } else if (fileCategory === 'private' || (!groupId && !fileCategory)) {
            folder = `workplaces/${workplaceId}/users/${userId}/files`;
        } else if (groupId) {
            folder = `workplaces/${workplaceId}/groups/${groupId}/files`;
        } else {
            folder = `workplaces/${workplaceId}/files`;
        }

        // Add subfolders based on file type for better organization
        if (fileCategory !== 'avatar' && fileCategory !== 'logo') {
            if (fileType.startsWith('image/')) {
                folder += '/images';
            } else if (fileType.startsWith('video/')) {
                folder += '/videos';
            } else if (fileType.startsWith('audio/')) {
                folder += '/audio';
            } else if (fileType === 'application/pdf' || fileType.includes('document') || fileType.includes('text')) {
                folder += '/documents';
            }
        }

        const fileKey = `${folder}/${uniqueFileName}`;

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
        });

        // Generate presigned URL
        const uploadUrl = await getSignedUrl(this.s3Client, putObjectCommand, { 
            expiresIn 
        });

        appLogger('S3 upload intent created', { 
            fileKey,
            folder, 
            fileName, 
            fileType, 
            userId, 
            workplaceId,
            groupId,
            fileCategory,
            expiresIn 
        });

        return {
            uploadUrl,
            fileKey,
            bucket: this.bucketName,
            expiresIn
        };
    }

    /**
     * Get circuit breaker statistics
     */
    getCircuitBreakerStats() {
        return {
            upload: circuitBreakerService.getBreakerStats('S3_UPLOAD'),
            download: circuitBreakerService.getBreakerStats('S3_DOWNLOAD'),
            delete: circuitBreakerService.getBreakerStats('S3_DELETE'),
            presign: circuitBreakerService.getBreakerStats('S3_PRESIGN')
        };
    }
} 