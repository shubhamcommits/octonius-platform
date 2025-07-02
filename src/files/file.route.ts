import { Router, Request, Response } from 'express'
import { FileController } from './file.controller'
import { FileService } from './file.service'
import { verifyAccessToken, isLoggedIn, requireWorkplace } from '../middleware'
import multer from 'multer'

// Configure multer for memory storage
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});

export class FileRoute {
    public router: Router
    public file_controller: FileController

    constructor() {
        this.router = Router()
        this.file_controller = new FileController(new FileService())
        this.configureRoutes()
    }

    private configureRoutes(): void {
        // Create a new file (requires auth and workplace)
        this.router.post('/', 
            verifyAccessToken, 
            isLoggedIn, 
            requireWorkplace,
            (req: Request, res: Response) => {
                this.file_controller.createFile(req, res)
            }
        )
        
        // Get all files for a user in a workplace (requires auth and workplace)
        this.router.get('/', 
            verifyAccessToken, 
            isLoggedIn, 
            requireWorkplace,
            (req: Request, res: Response) => {
                this.file_controller.getFilesByUserAndWorkplace(req, res)
            }
        )
        
        // Get MySpace files (private group files) for a user
        this.router.get('/myspace', 
            verifyAccessToken, 
            isLoggedIn, 
            requireWorkplace,
            (req: Request, res: Response) => {
                this.file_controller.getMySpaceFiles(req, res)
            }
        )

        // S3 Upload Intent - Create presigned URL for direct S3 upload
        this.router.post('/upload-intent', 
            verifyAccessToken, 
            isLoggedIn, 
            requireWorkplace,
            (req: Request, res: Response) => {
                this.file_controller.createUploadIntent(req, res)
            }
        )

        // Complete S3 file upload - Save file metadata after S3 upload
        this.router.post('/complete-upload', 
            verifyAccessToken, 
            isLoggedIn, 
            requireWorkplace,
            (req: Request, res: Response) => {
                this.file_controller.completeFileUpload(req, res)
            }
        )
        
        // Get a file by ID (requires auth)
        this.router.get('/:id', 
            verifyAccessToken, 
            isLoggedIn,
            (req: Request, res: Response) => {
                this.file_controller.getFileById(req, res)
            }
        )
        
        // Create a note (requires auth and workplace)
        this.router.post('/note', 
            verifyAccessToken, 
            isLoggedIn, 
            requireWorkplace,
            (req: Request, res: Response) => {
                this.file_controller.createNote(req, res)
            }
        )
        
        // Get a note by ID (requires auth)
        this.router.get('/note/:id', 
            verifyAccessToken, 
            isLoggedIn,
            (req: Request, res: Response) => {
                this.file_controller.getNoteById(req, res)
            }
        )
        
        // Update a note by ID (requires auth)
        this.router.put('/note/:id', 
            verifyAccessToken, 
            isLoggedIn,
            (req: Request, res: Response) => {
                this.file_controller.updateNote(req, res)
            }
        )
        
        // Upload file route (requires auth and workplace)
        this.router.post('/upload', 
            verifyAccessToken, 
            isLoggedIn, 
            requireWorkplace,
            upload.single('file'), // Add multer middleware
            (req: Request, res: Response) => {
                this.file_controller.uploadFile(req, res)
            }
        )
        
        // Download file route (requires auth)
        this.router.get('/:fileId/download', 
            verifyAccessToken, 
            isLoggedIn,
            (req: Request, res: Response) => {
                this.file_controller.downloadFile(req, res)
            }
        )

        // Get S3 download URL (presigned URL for secure downloads)
        this.router.get('/:fileId/download-url', 
            verifyAccessToken, 
            isLoggedIn,
            (req: Request, res: Response) => {
                this.file_controller.getFileDownloadUrl(req, res)
            }
        )
    }
} 