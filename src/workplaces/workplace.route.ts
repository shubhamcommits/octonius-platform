// Import express
import { Router, Request, Response } from 'express'

// Import workplace controller
import { WorkplaceController } from './workplace.controller'

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

        // Get user's workplaces
        this.router.get('/users/:user_id', (req: Request, res: Response) => {
            this.workplace_controller.getUserWorkplaces(req, res)
        })

        // Get all users in a workplace
        this.router.get('/:workplace_id/users', (req: Request, res: Response) => {
            this.workplace_controller.getWorkplaceUsers(req, res)
        })

        // Select a workplace for a user
        this.router.post('/:workplace_id/select', (req: Request, res: Response) => {
            this.workplace_controller.selectWorkplace(req, res)
        })
    }
} 