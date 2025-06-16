import { File } from './file.model'
import { FileCode } from './file.code'
import { FileResponse, FilesResponse } from './file.type'
import logger from '../logger'

interface FileCreationData {
    name: string
    type: 'note' | 'file'
    icon: string
    owner_id: string
    workplace_id: string
    size?: number
    mime_type?: string
    title?: string
    content?: any
    last_modified?: Date
}

export class FileService {
    async createFile(data: FileCreationData): Promise<FileResponse<File>> {
        try {
            const file = await File.create({
                ...data,
                last_modified: data.last_modified || new Date(),
            })
            logger.info('File created successfully', { fileId: file.id })
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

    async getFileById(id: string): Promise<FileResponse<File>> {
        try {
            const file = await File.findByPk(id)
            if (!file) {
                throw {
                    success: false,
                    message: FileCode.FILE_NOT_FOUND,
                    code: 404,
                    stack: new Error('File not found')
                }
            }
            return {
                success: true,
                message: FileCode.FILE_FOUND,
                code: 200,
                file
            }
        } catch (error) {
            logger.error('File retrieval failed', { error, id })
            throw {
                success: false,
                message: FileCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    async getFilesByUserAndWorkplace(owner_id: string, workplace_id: string): Promise<FilesResponse<File[]>> {
        try {
            const files = await File.findAll({
                where: { owner_id, workplace_id },
                order: [['last_modified', 'DESC']]
            })
            return {
                success: true,
                message: files.length ? FileCode.FILES_FOUND : FileCode.FILES_NOT_FOUND,
                code: 200,
                files
            }
        } catch (error) {
            logger.error('Files retrieval failed', { error, owner_id, workplace_id })
            throw {
                success: false,
                message: FileCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    async createNote(data: FileCreationData): Promise<FileResponse<File>> {
        try {
            const note = await File.create({
                ...data,
                type: 'note',
                icon: '📝',
                last_modified: data.last_modified || new Date(),
            })
            logger.info('Note created successfully', { noteId: note.id })
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

    async getNoteById(id: string): Promise<FileResponse<File>> {
        try {
            const note = await File.findOne({ where: { id, type: 'note' } })
            if (!note) {
                throw {
                    success: false,
                    message: FileCode.NOTE_NOT_FOUND,
                    code: 404,
                    stack: new Error('Note not found')
                }
            }
            return {
                success: true,
                message: FileCode.NOTE_FOUND,
                code: 200,
                file: note
            }
        } catch (error) {
            logger.error('Note retrieval failed', { error, id })
            throw {
                success: false,
                message: FileCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    async uploadFile(file: Express.Multer.File): Promise<{ success: boolean; file: any; message: string }> {
        try {
            // Implement file upload logic here (e.g., save to disk or cloud storage)
            // For now, return a mock response
            return {
                success: true,
                file: { id: 'mock-file-id', name: file.originalname },
                message: 'File uploaded successfully'
            };
        } catch (error: any) {
            throw { message: error.message, code: 500 };
        }
    }

    async downloadFile(fileId: string): Promise<{ data: Buffer; fileName: string; contentType: string }> {
        try {
            // Implement file download logic here (e.g., read from disk or cloud storage)
            // For now, return a mock response
            return {
                data: Buffer.from('mock file content'),
                fileName: 'mock-file.txt',
                contentType: 'text/plain'
            };
        } catch (error: any) {
            throw { message: error.message, code: 500 };
        }
    }
} 