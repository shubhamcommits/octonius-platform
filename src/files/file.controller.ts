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
            const result = await this.fileService.getFileById(id)
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
            const { user_id, workplace_id } = req.query
            if (!user_id || !workplace_id) {
                return res.status(400).json({
                    success: false,
                    message: 'user_id and workplace_id are required',
                    meta: { responseTime: '0ms' }
                })
            }
            const result = await this.fileService.getFilesByUserAndWorkplace(user_id as string, workplace_id as string)
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
            const result = await this.fileService.getNoteById(id)
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
            const result = await this.fileService.uploadFile(req.file);
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
            const result = await this.fileService.downloadFile(fileId);
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
} 