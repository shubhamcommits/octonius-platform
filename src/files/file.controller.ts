import { Request, Response } from 'express'
import { FileService } from './file.service'
import logger from '../logger'

export class FileController {
    private readonly fileService: FileService

    constructor(fileService: FileService) {
        this.fileService = fileService
    }

    async createFile(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        try {
            logger.info('Creating new file', { method: req.method, path: req.path, ip: req.ip })
            const fileData = req.body
            const result = await this.fileService.createFile(fileData)
            const responseTime = Date.now() - startTime
            logger.info('File created successfully', { fileId: result.file.id, responseTime: `${responseTime}ms`, statusCode: 201 })
            return res.status(201).json({
                success: true,
                data: result.file,
                message: result.message,
                meta: { responseTime: `${responseTime}ms` }
            })
        } catch (error: any) {
            const responseTime = Date.now() - startTime
            logger.error('Error in createFile controller', { error: error.message, stack: error.stack, responseTime: `${responseTime}ms`, statusCode: 500, body: req.body })
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    async getFileById(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        try {
            logger.info('Fetching file by ID', { method: req.method, path: req.path, params: req.params, ip: req.ip })
            const { id } = req.params
            const userId = (req as any).user?.uuid
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required',
                    meta: { responseTime: '0ms' }
                })
            }

            const result = await this.fileService.getFileById(id, userId)
            const responseTime = Date.now() - startTime
            logger.info('File retrieved successfully', { fileId: result.file.id, responseTime: `${responseTime}ms`, statusCode: 200 })
            return res.status(200).json({
                success: true,
                data: result.file,
                message: result.message,
                meta: { responseTime: `${responseTime}ms` }
            })
        } catch (error: any) {
            const responseTime = Date.now() - startTime
            logger.error('Error in getFileById controller', { error: error.message, stack: error.stack, responseTime: `${responseTime}ms`, statusCode: error.code || 500, params: req.params })
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    async getFilesByUserAndWorkplace(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        try {
            logger.info('Fetching files by user and workplace', { method: req.method, path: req.path, query: req.query, ip: req.ip })
            const { user_id, workplace_id, group_id } = req.query
            const requestUserId = (req as any).user?.uuid
            
            if (!requestUserId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required',
                    meta: { responseTime: '0ms' }
                })
            }

            if (!user_id || !workplace_id) {
                return res.status(400).json({
                    success: false,
                    message: 'user_id and workplace_id are required',
                    meta: { responseTime: '0ms' }
                })
            }

            // For security, ensure user can only access their own files unless they have group access
            if (user_id !== requestUserId && !group_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Can only access your own files without specifying a group',
                    meta: { responseTime: '0ms' }
                })
            }

            const result = await this.fileService.getFilesByUserAndWorkplace(
                requestUserId, 
                workplace_id as string, 
                group_id as string | undefined
            )
            const responseTime = Date.now() - startTime
            logger.info('Files retrieved successfully', { responseTime: `${responseTime}ms`, statusCode: 200 })
            return res.status(200).json({
                success: true,
                data: result.files,
                message: result.message,
                meta: { responseTime: `${responseTime}ms` }
            })
        } catch (error: any) {
            const responseTime = Date.now() - startTime
            logger.error('Error in getFilesByUserAndWorkplace controller', { error: error.message, stack: error.stack, responseTime: `${responseTime}ms`, statusCode: error.code || 500, query: req.query })
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    async getMySpaceFiles(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        try {
            logger.info('Fetching MySpace files', { method: req.method, path: req.path, ip: req.ip })
            const userId = (req as any).user?.uuid
            const workplaceId = (req as any).user?.current_workplace_id
            
            if (!userId || !workplaceId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication and workplace required',
                    meta: { responseTime: '0ms' }
                })
            }

            const result = await this.fileService.getMySpaceFiles(userId, workplaceId)
            const responseTime = Date.now() - startTime
            logger.info('MySpace files retrieved successfully', { responseTime: `${responseTime}ms`, statusCode: 200 })
            return res.status(200).json({
                success: true,
                data: result.files,
                message: result.message,
                meta: { responseTime: `${responseTime}ms` }
            })
        } catch (error: any) {
            const responseTime = Date.now() - startTime
            logger.error('Error in getMySpaceFiles controller', { error: error.message, stack: error.stack, responseTime: `${responseTime}ms`, statusCode: error.code || 500 })
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    async createNote(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        try {
            logger.info('Creating new note', { method: req.method, path: req.path, ip: req.ip })
            const noteData = req.body
            const result = await this.fileService.createNote(noteData)
            const responseTime = Date.now() - startTime
            logger.info('Note created successfully', { noteId: result.file.id, responseTime: `${responseTime}ms`, statusCode: 201 })
            return res.status(201).json({
                success: true,
                data: result.file,
                message: result.message,
                meta: { responseTime: `${responseTime}ms` }
            })
        } catch (error: any) {
            const responseTime = Date.now() - startTime
            logger.error('Error in createNote controller', { error: error.message, stack: error.stack, responseTime: `${responseTime}ms`, statusCode: error.code || 500, body: req.body })
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    async getNoteById(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        try {
            logger.info('Fetching note by ID', { method: req.method, path: req.path, params: req.params, ip: req.ip })
            const { id } = req.params
            const userId = (req as any).user?.uuid
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required',
                    meta: { responseTime: '0ms' }
                })
            }

            const result = await this.fileService.getNoteById(id, userId)
            const responseTime = Date.now() - startTime
            logger.info('Note retrieved successfully', { noteId: result.file.id, responseTime: `${responseTime}ms`, statusCode: 200 })
            return res.status(200).json({
                success: true,
                data: result.file,
                message: result.message,
                meta: { responseTime: `${responseTime}ms` }
            })
        } catch (error: any) {
            const responseTime = Date.now() - startTime
            logger.error('Error in getNoteById controller', { error: error.message, stack: error.stack, responseTime: `${responseTime}ms`, statusCode: error.code || 500, params: req.params })
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    async updateNote(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        try {
            logger.info('Updating note', { method: req.method, path: req.path, params: req.params, ip: req.ip })
            const { id } = req.params
            const noteData = req.body
            const userId = (req as any).user?.uuid
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required',
                    meta: { responseTime: '0ms' }
                })
            }

            const result = await this.fileService.updateNote(id, noteData, userId)
            const responseTime = Date.now() - startTime
            logger.info('Note updated successfully', { noteId: result.file.id, responseTime: `${responseTime}ms`, statusCode: 200 })
            return res.status(200).json({
                success: true,
                data: result.file,
                message: result.message,
                meta: { responseTime: `${responseTime}ms` }
            })
        } catch (error: any) {
            const responseTime = Date.now() - startTime
            logger.error('Error in updateNote controller', { error: error.message, stack: error.stack, responseTime: `${responseTime}ms`, statusCode: error.code || 500, params: req.params, body: req.body })
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    async uploadFile(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now();
        try {
            logger.info('Uploading file', { method: req.method, path: req.path, ip: req.ip });
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                    meta: { responseTime: '0ms' }
                });
            }

            // Get user and workplace from request (set by middleware)
            const userId = (req as any).user?.uuid;
            const workplaceId = (req as any).user?.current_workplace_id;
            const groupId = req.body.group_id; // Optional group_id from form data

            if (!userId || !workplaceId) {
                return res.status(400).json({
                    success: false,
                    message: 'User or workplace information not found',
                    meta: { responseTime: '0ms' }
                });
            }

            const result = await this.fileService.uploadFile(req.file, userId, workplaceId, groupId);
            const responseTime = Date.now() - startTime;
            logger.info('File uploaded successfully', { fileId: result.file.id, responseTime: `${responseTime}ms`, statusCode: 201 });
            return res.status(201).json({
                success: true,
                data: result.file,
                message: result.message,
                meta: { responseTime: `${responseTime}ms` }
            });
        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            logger.error('Error in uploadFile controller', { error: error.message, stack: error.stack, responseTime: `${responseTime}ms`, statusCode: 500 });
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            });
        }
    }

    async downloadFile(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now();
        try {
            logger.info('Downloading file', { method: req.method, path: req.path, params: req.params, ip: req.ip });
            const { fileId } = req.params;
            const userId = (req as any).user?.uuid;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required',
                    meta: { responseTime: '0ms' }
                });
            }

            const result = await this.fileService.downloadFile(fileId, userId);
            const responseTime = Date.now() - startTime;
            logger.info('File downloaded successfully', { fileId, responseTime: `${responseTime}ms`, statusCode: 200 });
            res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
            res.setHeader('Content-Type', result.contentType);
            return res.send(result.data);
        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            logger.error('Error in downloadFile controller', { error: error.message, stack: error.stack, responseTime: `${responseTime}ms`, statusCode: error.code || 500, params: req.params });
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            });
        }
    }

    async createUploadIntent(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now();
        try {
            logger.info('Creating S3 upload intent', { method: req.method, path: req.path, ip: req.ip });
            
            const { file_name, file_type, file_size, group_id } = req.body;
            const userId = (req as any).user?.uuid;
            const workplaceId = (req as any).user?.current_workplace_id;

            if (!userId || !workplaceId) {
                return res.status(400).json({
                    success: false,
                    message: 'User or workplace information not found',
                    meta: { responseTime: '0ms' }
                });
            }

            if (!file_name || !file_type || !file_size) {
                return res.status(400).json({
                    success: false,
                    message: 'file_name, file_type, and file_size are required',
                    meta: { responseTime: '0ms' }
                });
            }

            const result = await this.fileService.createUploadIntent(
                file_name,
                file_type,
                file_size,
                userId,
                workplaceId,
                group_id
            );

            const responseTime = Date.now() - startTime;
            logger.info('S3 upload intent created successfully', { 
                fileName: file_name,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            });

            return res.status(200).json({
                success: true,
                data: result.data,
                message: result.message,
                meta: { responseTime: `${responseTime}ms` }
            });
        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            logger.error('Error in createUploadIntent controller', { 
                error: error.message,
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                body: req.body
            });
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            });
        }
    }

    async completeFileUpload(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now();
        try {
            logger.info('Completing file upload', { method: req.method, path: req.path, ip: req.ip });
            
            const { file_key, file_name, file_type, file_size, group_id } = req.body;
            const userId = (req as any).user?.uuid;
            const workplaceId = (req as any).user?.current_workplace_id;

            if (!userId || !workplaceId) {
                return res.status(400).json({
                    success: false,
                    message: 'User or workplace information not found',
                    meta: { responseTime: '0ms' }
                });
            }

            if (!file_key || !file_name || !file_type || !file_size || !group_id) {
                return res.status(400).json({
                    success: false,
                    message: 'file_key, file_name, file_type, file_size, and group_id are required',
                    meta: { responseTime: '0ms' }
                });
            }

            const result = await this.fileService.completeFileUpload(
                file_key,
                file_name,
                file_type,
                file_size,
                userId,
                workplaceId,
                group_id
            );

            const responseTime = Date.now() - startTime;
            logger.info('File upload completed successfully', { 
                fileId: result.file.id,
                fileName: file_name,
                responseTime: `${responseTime}ms`,
                statusCode: 201
            });

            return res.status(201).json({
                success: true,
                data: result.file,
                message: result.message,
                meta: { responseTime: `${responseTime}ms` }
            });
        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            logger.error('Error in completeFileUpload controller', { 
                error: error.message,
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                body: req.body
            });
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            });
        }
    }

    async getFileDownloadUrl(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now();
        try {
            logger.info('Getting file download URL', { method: req.method, path: req.path, params: req.params, ip: req.ip });
            
            const { fileId } = req.params;
            const userId = (req as any).user?.uuid;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required',
                    meta: { responseTime: '0ms' }
                });
            }

            const result = await this.fileService.getFileDownloadUrl(fileId, userId);
            const responseTime = Date.now() - startTime;
            
            logger.info('File download URL generated successfully', { 
                fileId,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            });

            return res.status(200).json({
                success: true,
                data: result.data,
                message: result.message,
                meta: { responseTime: `${responseTime}ms` }
            });
        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            logger.error('Error in getFileDownloadUrl controller', { 
                error: error.message,
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                params: req.params
            });
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            });
        }
    }
} 