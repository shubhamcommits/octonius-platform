// Importing the Router, Request, and Response from the express library
import { Router, Request, Response } from 'express'

// Import User Controller
import { UserController } from './user.controller'

// Import User Service
import { UserService } from './user.service'

// Export User Route
export class UserRoute {
    // Router Instance
    public router: Router

    // User Controller Instance
    public user_controller: UserController

    // Constructor
    constructor() {
        // Initialize Router
        this.router = Router()

        // Initialize User Controller with User Service
        this.user_controller = new UserController(new UserService())

        // Configure Routes
        this.configureRoutes()
    }

    /**
     * This function is responsible for configuring the routes for the UserRoute
     */
    private configureRoutes(): void {
        // Base routes for users collection
        this.router
            // Create a new user
            .post('/', (req: Request, res: Response) => {
                this.user_controller.createUser(req, res)
            })
            // Get all users (with optional query parameters for filtering/pagination)
            .get('/', (req: Request, res: Response) => {
                this.user_controller.getUsers(req, res)
            })

        // Routes for specific user
        this.router
            // Get user by UUID
            .get('/:uuid', (req: Request, res: Response) => {
                this.user_controller.getUserById(req, res)
            })
            // Update user
            .put('/:uuid', (req: Request, res: Response) => {
                this.user_controller.updateUser(req, res)
            })
            // Delete user
            .delete('/:uuid', (req: Request, res: Response) => {
                this.user_controller.deleteUser(req, res)
            })

        // Nested routes for user's workplaces
        this.router
            // Add user to workplace
            .post('/:uuid/workplaces', (req: Request, res: Response) => {
                this.user_controller.addUserToWorkplace(req, res)
            })
            // Remove user from workplace
            .delete('/:uuid/workplaces/:workplaceId', (req: Request, res: Response) => {
                this.user_controller.removeUserFromWorkplace(req, res)
            })

        // Special routes
        this.router
            // Get user by email (special lookup)
            .get('/email/:email', (req: Request, res: Response) => {
                this.user_controller.getUserByEmail(req, res)
            })
    }
} 