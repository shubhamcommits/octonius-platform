// Importing the Router, Request, and Response from the express library
import { Router, Request, Response } from 'express'

// Import User Controller
import { UserController } from './user.controller'

// Import User Service
import { UserService } from './user.service'

// Import Auth Middleware
import { verifyAccessToken, isLoggedIn } from '../middleware'

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

        // Get current user route (requires authentication)
        this.router.get('/me', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.user_controller.getCurrentUser(req, res)
            }
        )
        
        // Get user by email (public route - used during login)
        this.router.get('/email/:email', (req: Request, res: Response) => {
            this.user_controller.getUserByEmail(req, res)
        })

        // Base routes for users collection
        this.router
            // Create a new user (public route - used during registration)
            .post('/', (req: Request, res: Response) => {
                this.user_controller.createUser(req, res)
            })
            // Get all users (requires authentication)
            .get('/', 
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.user_controller.getUsers(req, res)
                }
            )

        // Routes for specific user - AFTER special routes
        this.router
            // Get user by UUID (requires authentication)
            .get('/:uuid', 
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.user_controller.getUserById(req, res)
                }
            )
            // Update user (requires authentication)
            .put('/:uuid', 
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.user_controller.updateUser(req, res)
                }
            )
            // Delete user (requires authentication)
            .delete('/:uuid', 
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.user_controller.deleteUser(req, res)
                }
            )

        // Nested routes for user's workplaces
        this.router
            // Add user to workplace (requires authentication)
            .post('/:uuid/workplaces', 
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.user_controller.addUserToWorkplace(req, res)
                }
            )
            // Remove user from workplace (requires authentication)
            .delete('/:uuid/workplaces/:workplaceId', 
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.user_controller.removeUserFromWorkplace(req, res)
                }
            )
    }
} 