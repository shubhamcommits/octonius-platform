import { File } from './file.model'
import { FileCode } from './file.code'
import { FileResponse, FilesResponse } from './file.type'
import { User } from '../users/user.model'
import { Workplace } from '../workplaces/workplace.model'
import { Group } from '../groups/group.model'
import { GroupMembership } from '../groups/group-membership.model'
import { PrivateGroupService } from '../groups/private-group.service'
import { S3Service } from '../shared/s3.service'
import logger from '../logger'
import * as path from 'path'
import * as fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import fetch, { Response } from 'node-fetch'

interface FileCreationData {
    name: string
    type: 'note' | 'file'
    icon: string
    user_id: string
    workplace_id: string
    group_id?: string // Optional - will be resolved if not provided
    size?: number
    mime_type?: string
    title?: string
    content?: any
    last_modified?: Date
}

export class FileService {
    private uploadDir = path.join(process.cwd(), 'uploads');
    private privateGroupService = new PrivateGroupService();
    private s3Service = new S3Service();

    constructor() {
        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Validates if a user has access to a group
     */
    private async validateGroupAccess(userId: string, groupId: string): Promise<boolean> {
        try {
            const membership = await GroupMembership.findOne({
                where: {
                    user_id: userId,
                    group_id: groupId,
                    status: 'active'
                }
            });
            return !!membership;
        } catch (error) {
            logger.error('Error validating group access', { error, userId, groupId });
            return false;
        }
    }

    /**
     * Gets or creates the appropriate group for file storage
     * For MySpace files, ensures private group exists
     * For regular files, validates group access
     */
    private async resolveGroupForFile(userId: string, workplaceId: string, groupId?: string, userName?: string): Promise<string> {
        try {
            if (groupId) {
                // Validate user has access to the specified group
                const hasAccess = await this.validateGroupAccess(userId, groupId);
                if (!hasAccess) {
                    throw new Error('User does not have access to the specified group');
                }
                return groupId;
            } else {
                // No group specified - create/get private group for MySpace files
                if (!userName) {
                    const user = await User.findByPk(userId);
                    userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'User' : 'User';
                }
                const privateGroup = await this.privateGroupService.ensurePrivateGroupExists(userId, workplaceId, userName);
                return privateGroup.uuid;
            }
        } catch (error) {
            logger.error('Error resolving group for file', { error, userId, workplaceId, groupId });
            throw error;
        }
    }

    async createFile(data: FileCreationData): Promise<FileResponse<File>> {
        try {
            // Resolve the group for this file
            const resolvedGroupId = await this.resolveGroupForFile(
                data.user_id, 
                data.workplace_id, 
                data.group_id
            );

            const file = await File.create({
                ...data,
                group_id: resolvedGroupId,
                last_modified: data.last_modified || new Date(),
            })
            logger.info('File created successfully', { fileId: file.id, groupId: resolvedGroupId })
            return {
                success: true,
                message: FileCode.FILE_CREATED,
                code: 201,
                file
            }
        } catch (error) {
            logger.error('File creation failed', { error, data })
            throw {
                success: false,
                message: FileCode.FILE_CREATION_FAILED,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    async getFileById(id: string, userId: string): Promise<FileResponse<File>> {
        try {
            const file = await File.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                    },
                    {
                        model: Group,
                        as: 'group',
                        attributes: ['uuid', 'name', 'type']
                    }
                ]
            })
            
            if (!file) {
                throw {
                    success: false,
                    message: FileCode.FILE_NOT_FOUND,
                    code: 404,
                    stack: new Error('File not found')
                }
            }

            // Validate user has access to the file's group
            const hasAccess = await this.validateGroupAccess(userId, file.group_id);
            if (!hasAccess) {
                throw {
                    success: false,
                    message: 'Access denied to file',
                    code: 403,
                    stack: new Error('User does not have access to this file')
                }
            }

            return {
                success: true,
                message: FileCode.FILE_FOUND,
                code: 200,
                file
            }
        } catch (error) {
            logger.error('File retrieval failed', { error, id, userId })
            throw {
                success: false,
                message: FileCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Gets files for a user - can be filtered by group or get all accessible files
     */
    async getFilesByUserAndWorkplace(user_id: string, workplace_id: string, group_id?: string): Promise<FilesResponse<File[]>> {
        try {
            let whereClause: any = {
                workplace_id
            };

            if (group_id) {
                // Validate user has access to the specific group
                const hasAccess = await this.validateGroupAccess(user_id, group_id);
                if (!hasAccess) {
                    throw new Error('User does not have access to the specified group');
                }
                whereClause.group_id = group_id;
            } else {
                // Get all groups user has access to
                const userMemberships = await GroupMembership.findAll({
                    where: {
                        user_id,
                        status: 'active'
                    },
                    include: [{
                        model: Group,
                        as: 'group',
                        where: { workplace_id }
                    }]
                });

                const accessibleGroupIds = userMemberships.map(membership => membership.group_id);
                if (accessibleGroupIds.length === 0) {
                    // User has no group memberships, return empty result
                    return {
                        success: true,
                        message: FileCode.FILES_NOT_FOUND,
                        code: 200,
                        files: []
                    };
                }

                whereClause.group_id = accessibleGroupIds;
            }

            const files = await File.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                    },
                    {
                        model: Group,
                        as: 'group',
                        attributes: ['uuid', 'name', 'type']
                    }
                ],
                order: [['last_modified', 'DESC']]
            })

            // Transform files to match frontend expectations
            const transformedFiles = files.map(file => {
                const fileData = file.toJSON() as any;
                const owner = fileData.owner || {};
                return {
                    ...fileData,
                    owner: `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email || 'Unknown User',
                    owner_avatar: owner.avatar_url || this.getInitials(`${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email || 'U'),
                    last_modified: fileData.last_modified || fileData.updated_at,
                    mime_type: fileData.mime_type
                };
            });

            return {
                success: true,
                message: files.length ? FileCode.FILES_FOUND : FileCode.FILES_NOT_FOUND,
                code: 200,
                files: transformedFiles
            }
        } catch (error) {
            logger.error('Files retrieval failed', { error, user_id, workplace_id, group_id })
            throw {
                success: false,
                message: FileCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Gets files for MySpace (private group only)
     */
    async getMySpaceFiles(user_id: string, workplace_id: string): Promise<FilesResponse<File[]>> {
        try {
            // Get user's private group
            const privateGroup = await this.privateGroupService.getPrivateGroupForUser(user_id, workplace_id);
            if (!privateGroup) {
                // No private group exists yet, return empty
                return {
                    success: true,
                    message: FileCode.FILES_NOT_FOUND,
                    code: 200,
                    files: []
                };
            }

            return this.getFilesByUserAndWorkplace(user_id, workplace_id, privateGroup.uuid);
        } catch (error) {
            logger.error('MySpace files retrieval failed', { error, user_id, workplace_id })
            throw {
                success: false,
                message: FileCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    private getInitials(name: string): string {
        return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2) || 'U';
    }

    /**
     * Infer file category based on filename, type, and context
     */
    private inferFileCategory(fileName: string, fileType: string, groupId?: string): 'avatar' | 'logo' | 'private' | 'document' | null {
        const lowerFileName = fileName.toLowerCase();
        
        // Check for avatar files
        if (lowerFileName.includes('avatar') || lowerFileName.includes('profile')) {
            return 'avatar';
        }
        
        // Check for logo files
        if (lowerFileName.includes('logo') || lowerFileName.includes('brand')) {
            return 'logo';
        }
        
        // Check for documents
        if (fileType === 'application/pdf' || 
            fileType.includes('document') || 
            fileType.includes('sheet') ||
            fileType.includes('presentation') ||
            lowerFileName.includes('document') ||
            lowerFileName.includes('report')) {
            return 'document';
        }
        
        // If no group ID, assume private file
        if (!groupId) {
            return 'private';
        }
        
        // Default to null for regular group files
        return null;
    }

    async createNote(data: FileCreationData): Promise<FileResponse<File>> {
        try {
            // Resolve the group for this note
            const resolvedGroupId = await this.resolveGroupForFile(
                data.user_id, 
                data.workplace_id, 
                data.group_id
            );

            const note = await File.create({
                ...data,
                group_id: resolvedGroupId,
                last_modified: data.last_modified || new Date(),
            })
            logger.info('Note created successfully', { noteId: note.id, groupId: resolvedGroupId })
            return {
                success: true,
                message: FileCode.NOTE_CREATED,
                code: 201,
                file: note
            }
        } catch (error) {
            logger.error('Note creation failed', { error, data })
            throw {
                success: false,
                message: FileCode.NOTE_CREATION_FAILED,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    async getNoteById(id: string, userId: string): Promise<FileResponse<File>> {
        try {
            const note = await File.findOne({ 
                where: { id, type: 'note' },
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                    },
                    {
                        model: Group,
                        as: 'group',
                        attributes: ['uuid', 'name', 'type']
                    }
                ]
            })
            
            if (!note) {
                throw {
                    success: false,
                    message: FileCode.NOTE_NOT_FOUND,
                    code: 404,
                    stack: new Error('Note not found')
                }
            }

            // Validate user has access to the note's group
            const hasAccess = await this.validateGroupAccess(userId, note.group_id);
            if (!hasAccess) {
                throw {
                    success: false,
                    message: 'Access denied to note',
                    code: 403,
                    stack: new Error('User does not have access to this note')
                }
            }

            return {
                success: true,
                message: FileCode.NOTE_FOUND,
                code: 200,
                file: note
            }
        } catch (error) {
            logger.error('Note retrieval failed', { error, id, userId })
            throw {
                success: false,
                message: FileCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    async updateNote(id: string, data: Partial<FileCreationData>, userId: string): Promise<FileResponse<File>> {
        try {
            const note = await File.findOne({ where: { id, type: 'note' } });
            if (!note) {
                throw {
                    success: false,
                    message: FileCode.NOTE_NOT_FOUND,
                    code: 404,
                    stack: new Error('Note not found')
                };
            }

            // Validate user has access to the note's group
            const hasAccess = await this.validateGroupAccess(userId, note.group_id);
            if (!hasAccess) {
                throw {
                    success: false,
                    message: 'Access denied to note',
                    code: 403,
                    stack: new Error('User does not have access to this note')
                };
            }

            await note.update({
                ...data,
                last_modified: new Date()
            });

            // Fetch updated note with user info
            const updatedNote = await File.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                    },
                    {
                        model: Group,
                        as: 'group',
                        attributes: ['uuid', 'name', 'type']
                    }
                ]
            });

            logger.info('Note updated successfully', { noteId: id });
            
            return {
                success: true,
                message: FileCode.FILE_UPDATED,
                code: 200,
                file: updatedNote!
            };
        } catch (error) {
            logger.error('Note update failed', { error, id, data, userId });
            throw {
                success: false,
                message: FileCode.FILE_UPDATE_FAILED,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            };
        }
    }

    async uploadFile(file: Express.Multer.File, userId: string, workplaceId: string, groupId?: string): Promise<{ success: boolean; file: any; message: string }> {
        try {
            // Resolve the group for this file
            const resolvedGroupId = await this.resolveGroupForFile(userId, workplaceId, groupId);

            // Generate unique filename
            const fileExtension = path.extname(file.originalname);
            const fileName = `${uuidv4()}${fileExtension}`;
            const filePath = path.join(this.uploadDir, fileName);

            // Save file to disk
            fs.writeFileSync(filePath, file.buffer);

            // Get file type from extension
            const fileType = this.getFileTypeFromExtension(fileExtension);

            // Create file record in database
            const fileRecord = await File.create({
                name: file.originalname,
                type: 'file',
                icon: this.getFileIcon(fileType),
                user_id: userId,
                workplace_id: workplaceId,
                group_id: resolvedGroupId,
                size: file.size,
                mime_type: file.mimetype,
                content: { filePath: fileName }, // Store the filename for retrieval
                last_modified: new Date()
            });

            const user = await User.findByPk(userId, {
                attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
            });

            const responseFile = {
                ...fileRecord.toJSON(),
                owner: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User' : 'Unknown User',
                owner_avatar: user?.avatar_url || this.getInitials(user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'U' : 'U'),
                last_modified: fileRecord.last_modified,
                mime_type: fileRecord.mime_type
            };

            logger.info('File uploaded successfully', { 
                fileId: fileRecord.id, 
                originalName: file.originalname,
                groupId: resolvedGroupId
            });
            
            return {
                success: true,
                file: responseFile,
                message: 'File uploaded successfully'
            };
        } catch (error: any) {
            logger.error('File upload failed', { error: error.message, fileName: file.originalname });
            throw { message: error.message, code: 500 };
        }
    }

    async downloadFile(fileId: string, userId: string): Promise<{ data: Buffer; fileName: string; contentType: string }> {
        try {
            const file = await File.findByPk(fileId);
            if (!file) {
                throw { message: 'File not found', code: 404 };
            }

            // Validate user has access to the file's group
            const hasAccess = await this.validateGroupAccess(userId, file.group_id);
            if (!hasAccess) {
                throw { message: 'Access denied to file', code: 403 };
            }

            if (file.type === 'note') {
                // For notes, return the content as text
                const content = JSON.stringify(file.content || {}, null, 2);
                return {
                    data: Buffer.from(content),
                    fileName: `${file.name}.json`,
                    contentType: 'application/json'
                };
            }

            // For S3 files, use S3 download
            if (file.content?.s3Key) {
                try {
                    const downloadIntent = await this.s3Service.createDownloadIntent(file.content.s3Key);
                    
                    // Fetch file from S3 using presigned URL
                    const response: Response = await fetch(downloadIntent.downloadUrl);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch file from S3: ${response.status} ${response.statusText}`);
                    }
                    
                    const arrayBuffer = await response.arrayBuffer();
                    const data = Buffer.from(arrayBuffer);
                    
                    return {
                        data,
                        fileName: file.name,
                        contentType: file.mime_type || 'application/octet-stream'
                    };
                } catch (s3Error) {
                    logger.error('S3 download failed, checking local fallback', { fileId, s3Key: file.content.s3Key, error: s3Error });
                    throw { message: 'Failed to download file from S3', code: 404 };
                }
            }

            // For legacy local files, read from disk
            if (file.content?.filePath) {
                const filePath = path.join(this.uploadDir, file.content.filePath);
                if (!fs.existsSync(filePath)) {
                    throw { message: 'File not found on disk', code: 404 };
                }

                const data = fs.readFileSync(filePath);
                return {
                    data,
                    fileName: file.name,
                    contentType: file.mime_type || 'application/octet-stream'
                };
            }

            // If no storage method is found
            throw { message: 'File storage information not found', code: 404 };
        } catch (error: any) {
            logger.error('File download failed', { error: error.message, fileId, userId });
            throw { message: error.message, code: error.code || 500 };
        }
    }

    private getFileTypeFromExtension(extension: string): string {
        const ext = extension.toLowerCase();
        const typeMap: { [key: string]: string } = {
            '.pdf': 'pdf',
            '.doc': 'doc',
            '.docx': 'docx',
            '.xls': 'xls',
            '.xlsx': 'xlsx',
            '.ppt': 'ppt',
            '.pptx': 'pptx',
            '.jpg': 'image',
            '.jpeg': 'image',
            '.png': 'image',
            '.gif': 'image',
            '.mp4': 'video',
            '.avi': 'video',
            '.mp3': 'audio',
            '.wav': 'audio'
        };
        return typeMap[ext] || 'default';
    }

    private getFileIcon(type: string): string {
        const icons: { [key: string]: string } = {
            'note': '📝',
            'pdf': '📄',
            'doc': '📄',
            'docx': '📄',
            'xls': '📊',
            'xlsx': '📊',
            'ppt': '📊',
            'pptx': '📊',
            'image': '🖼️',
            'video': '🎥',
            'audio': '🎵',
            'folder': '📁',
            'default': '📄'
        };
        return icons[type] || icons['default'];
    }

    /**
     * Create S3 upload intent (presigned URL for direct upload)
     * @param fileName - Original file name
     * @param fileType - MIME type
     * @param fileSize - File size in bytes
     * @param userId - User ID
     * @param workplaceId - Workplace ID  
     * @param groupId - Optional group ID
     * @returns Upload intent with presigned URL and metadata
     */
    async createUploadIntent(
        fileName: string,
        fileType: string,
        fileSize: number,
        userId: string,
        workplaceId: string,
        groupId?: string
    ): Promise<{ success: boolean; data: any; message: string }> {
        try {
            // Resolve the group for this file
            const resolvedGroupId = await this.resolveGroupForFile(userId, workplaceId, groupId);

            // Create S3 upload intent with smart organization
            const fileCategory = this.inferFileCategory(fileName, fileType, groupId)
            const uploadIntent = await this.s3Service.createUploadIntent(
                fileName,
                fileType,
                userId,
                workplaceId,
                resolvedGroupId,
                fileCategory
            );

            // Get file type and icon
            const fileExtension = path.extname(fileName);
            const fileTypeCategory = this.getFileTypeFromExtension(fileExtension);
            const icon = this.getFileIcon(fileTypeCategory);

            // Return upload intent with metadata
            const intentData = {
                upload_url: uploadIntent.uploadUrl,
                file_key: uploadIntent.fileKey,
                bucket: uploadIntent.bucket,
                expires_in: uploadIntent.expiresIn,
                metadata: {
                    file_name: fileName,
                    file_type: fileType,
                    file_size: fileSize,
                    icon,
                    resolved_group_id: resolvedGroupId,
                    user_id: userId,
                    workplace_id: workplaceId
                }
            };

            logger.info('S3 upload intent created', { 
                fileName, 
                fileKey: uploadIntent.fileKey,
                userId, 
                workplaceId,
                groupId: resolvedGroupId
            });

            return {
                success: true,
                data: intentData,
                message: 'Upload intent created successfully'
            };
        } catch (error: any) {
            logger.error('Failed to create upload intent', { 
                error: error.message,
                fileName,
                userId,
                workplaceId,
                groupId
            });
            throw { message: error.message, code: 500 };
        }
    }

    /**
     * Complete file upload after S3 upload is done
     * @param fileKey - S3 file key
     * @param fileName - Original file name
     * @param fileType - MIME type
     * @param fileSize - File size in bytes
     * @param userId - User ID
     * @param workplaceId - Workplace ID
     * @param groupId - Group ID
     * @returns Created file record
     */
    async completeFileUpload(
        fileKey: string,
        fileName: string,
        fileType: string,
        fileSize: number,
        userId: string,
        workplaceId: string,
        groupId: string
    ): Promise<{ success: boolean; file: any; message: string }> {
        try {
            // Get file type and icon
            const fileExtension = path.extname(fileName);
            const fileTypeCategory = this.getFileTypeFromExtension(fileExtension);
            const icon = this.getFileIcon(fileTypeCategory);

            // Create file record in database with S3 info
            const fileRecord = await File.create({
                name: fileName,
                type: 'file',
                icon,
                user_id: userId,
                workplace_id: workplaceId,
                group_id: groupId,
                size: fileSize,
                mime_type: fileType,
                content: { 
                    s3Key: fileKey,
                    s3Bucket: this.s3Service['bucketName'],
                    uploadType: 's3'
                },
                cdn_url: this.s3Service.getCDNUrl(fileKey), // Store CDN URL directly
                last_modified: new Date()
            });

            // Get user info for response
            const user = await User.findByPk(userId, {
                attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
            });

            const responseFile = {
                ...fileRecord.toJSON(),
                owner: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User' : 'Unknown User',
                owner_avatar: user?.avatar_url || this.getInitials(user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'U' : 'U'),
                last_modified: fileRecord.last_modified,
                mime_type: fileRecord.mime_type,
                cdn_url: this.s3Service.getCDNUrl(fileKey) // Add CDN URL for public access
            };

            logger.info('File upload completed', { 
                fileId: fileRecord.id,
                fileKey,
                fileName,
                userId,
                workplaceId,
                groupId
            });

            return {
                success: true,
                file: responseFile,
                message: 'File upload completed successfully'
            };
        } catch (error: any) {
            logger.error('Failed to complete file upload', { 
                error: error.message,
                fileKey,
                fileName,
                userId,
                workplaceId,
                groupId
            });
            throw { message: error.message, code: 500 };
        }
    }

    /**
     * Get S3 download URL for a file
     * @param fileId - File ID
     * @param userId - User ID
     * @returns Download URL
     */
    async getFileDownloadUrl(fileId: string, userId: string): Promise<{ success: boolean; data: any; message: string }> {
        try {
            const file = await File.findByPk(fileId);
            if (!file) {
                throw { message: 'File not found', code: 404 };
            }

            // Validate user has access to the file's group
            const hasAccess = await this.validateGroupAccess(userId, file.group_id);
            if (!hasAccess) {
                throw { message: 'Access denied to file', code: 403 };
            }

            if (file.type === 'note') {
                // For notes, return the content directly
                return {
                    success: true,
                    data: {
                        type: 'note',
                        content: file.content,
                        file_name: file.name
                    },
                    message: 'Note content retrieved'
                };
            }

            // For S3 files, generate download URL
            if (file.content?.s3Key) {
                logger.info('Generating S3 download URL', { 
                    fileId, 
                    s3Key: file.content.s3Key,
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.mime_type,
                    uploadType: file.content.uploadType,
                    bucket: file.content.s3Bucket
                });

                try {
                    const downloadIntent = await this.s3Service.createDownloadIntent(file.content.s3Key);
                    
                    logger.info('S3 download URL generated successfully', { 
                        fileId, 
                        downloadUrl: downloadIntent.downloadUrl.substring(0, 100) + '...' // Log partial URL for debugging
                    });

                    return {
                        success: true,
                        data: {
                            type: 'file',
                            download_url: downloadIntent.downloadUrl,
                            cdn_url: this.s3Service.getCDNUrl(file.content.s3Key),
                            file_name: file.name,
                            file_type: file.mime_type,
                            file_size: file.size,
                            expires_in: downloadIntent.expiresIn
                        },
                        message: 'Download URL generated'
                    };
                } catch (s3Error) {
                    logger.error('Failed to generate S3 download URL', { 
                        fileId, 
                        s3Key: file.content.s3Key,
                        error: s3Error
                    });
                    throw { message: `Failed to generate download URL for S3 file: ${s3Error}`, code: 500 };
                }
            }

            // Fallback for legacy local files
            throw { message: 'File not found in storage', code: 404 };
        } catch (error: any) {
            logger.error('Failed to get download URL', { 
                error: error.message,
                fileId,
                userId
            });
            throw { message: error.message, code: error.code || 500 };
        }
    }

    /**
     * Delete a file and its associated storage
     * @param fileId - File ID
     * @param userId - User ID
     * @returns Success message
     */
    async deleteFile(fileId: string, userId: string): Promise<{ success: boolean; data: any; message: string }> {
        try {
            const file = await File.findByPk(fileId);
            if (!file) {
                throw { message: 'File not found', code: 404 };
            }

            // Validate user has access to the file's group
            const hasAccess = await this.validateGroupAccess(userId, file.group_id);
            if (!hasAccess) {
                throw { message: 'Access denied to file', code: 403 };
            }

            // For S3 files, delete from S3
            if (file.content?.s3Key) {
                try {
                    await this.s3Service.deleteFile(file.content.s3Key);
                    logger.info('File deleted from S3', { fileId, s3Key: file.content.s3Key });
                } catch (s3Error) {
                    logger.warn('Failed to delete file from S3, but continuing with database deletion', { 
                        fileId, 
                        s3Key: file.content.s3Key,
                        error: s3Error
                    });
                }
            }

            // For legacy local files, delete from disk
            if (file.content?.filePath) {
                try {
                    const filePath = path.join(this.uploadDir, file.content.filePath);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        logger.info('File deleted from disk', { fileId, filePath: file.content.filePath });
                    }
                } catch (diskError) {
                    logger.warn('Failed to delete file from disk, but continuing with database deletion', { 
                        fileId, 
                        filePath: file.content.filePath,
                        error: diskError
                    });
                }
            }

            // Delete file record from database
            await file.destroy();

            logger.info('File deleted successfully', { 
                fileId,
                fileName: file.name,
                userId
            });

            return {
                success: true,
                data: { fileId, fileName: file.name },
                message: 'File deleted successfully'
            };
        } catch (error: any) {
            logger.error('Failed to delete file', { 
                error: error.message,
                fileId,
                userId
            });
            throw { message: error.message, code: error.code || 500 };
        }
    }
} 