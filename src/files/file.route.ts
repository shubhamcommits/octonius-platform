import { Router, Request, Response } from 'express'
import { FileController } from './file.controller'
import { FileService } from './file.service'

export class FileRoute {
    public router: Router
    public file_controller: FileController

    constructor() {
        this.router = Router()
        this.file_controller = new FileController(new FileService())
        this.configureRoutes()
    }

    private configureRoutes(): void {
        // Create a new file
        this.router.post('/', (req: Request, res: Response) => {
            this.file_controller.createFile(req, res)
        })
        // Get a file by ID
        this.router.get('/:id', (req: Request, res: Response) => {
            this.file_controller.getFileById(req, res)
        })
        // Get all files for a user in a workplace
        this.router.get('/', (req: Request, res: Response) => {
            this.file_controller.getFilesByUserAndWorkplace(req, res)
        })
        // Create a note
        this.router.post('/notes', (req: Request, res: Response) => {
            this.file_controller.createNote(req, res)
        })
        // Get a note by ID
        this.router.get('/notes/:id', (req: Request, res: Response) => {
            this.file_controller.getNoteById(req, res)
        })
        // Upload file route
        this.router.post('/upload', (req: Request, res: Response) => {
            this.file_controller.uploadFile(req, res)
        })
        // Download file route
        this.router.get('/:fileId/download', (req: Request, res: Response) => {
            this.file_controller.downloadFile(req, res)
        })
    }
} 