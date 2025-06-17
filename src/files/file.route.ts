import { Router, Request, Response } from 'express'
import { FileController } from './file.controller'
import { FileService } from './file.service'
import { verifyAccessToken, isLoggedIn, requireWorkplace } from '../middleware'

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
        
        // Get a file by ID (requires auth)
        this.router.get('/:id', 
            verifyAccessToken, 
            isLoggedIn,
            (req: Request, res: Response) => {
                this.file_controller.getFileById(req, res)
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
        
        // Upload file route (requires auth and workplace)
        this.router.post('/upload', 
            verifyAccessToken, 
            isLoggedIn, 
            requireWorkplace,
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
    }
} 