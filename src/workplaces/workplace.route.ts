// Import express
import { Router, Request, Response } from 'express'

// Import workplace controller
import { WorkplaceController } from './workplace.controller'

// Import Auth Middleware
import { verifyAccessToken, isLoggedIn } from '../middleware'

export class WorkplaceRoute {

    // Router
    public router: Router

    // Controller
    private workplace_controller: WorkplaceController

    constructor() {

        // Initialize router and controller
        this.router = Router()

        // Initialize controller
        this.workplace_controller = new WorkplaceController()

        // Configure routes
        this.configureRoutes()
    }

    /**
     * Configure routes for workplace endpoints
     */
    private configureRoutes(): void {

        // Get all workplaces (requires auth)
        this.router.get('/', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.workplace_controller.getAllWorkplaces(req, res)
            }
        )

        // Create a new workplace (requires auth)
        this.router.post('/', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.workplace_controller.createWorkplace(req, res)
            }
        )

        // Get user's workplaces (requires auth)
        this.router.get('/users/:user_id', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.workplace_controller.getUserWorkplaces(req, res)
            }
        )

        // Get all users in a workplace (requires auth)
        this.router.get('/:workplace_id/users', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.workplace_controller.getWorkplaceUsers(req, res)
            }
        )

        // Select a workplace for a user (requires auth)
        this.router.post('/:workplace_id/select', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.workplace_controller.selectWorkplace(req, res)
            }
        )
    }
} 