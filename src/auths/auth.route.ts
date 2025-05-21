// Importing the Router, Request, and Response from the express library
import { Router, Request, Response } from 'express'
// Import Auth Controller
import { AuthController } from './auth.controller'
// Import Auth Service
import { AuthService } from './auth.service'

/**
 * AuthRoute class for configuring authentication-related routes
 */
export class AuthRoute {
    // Router Instance
    public router: Router
    // Auth Controller Instance
    public auth_controller: AuthController

    // Constructor
    constructor() {
        // Initialize Router
        this.router = Router()
        // Initialize Auth Controller with Auth Service
        this.auth_controller = new AuthController(new AuthService())
        // Configure Routes
        this.configure_routes()
    }

    /**
     * This function is responsible for configuring the routes for the AuthRoute
     */
    private configure_routes(): void {
        // Register route
        this.router.post('/register', (req: Request, res: Response) => {
            this.auth_controller.register(req, res)
        })
        // Login route
        this.router.post('/login', (req: Request, res: Response) => {
            this.auth_controller.request_otp(req, res)
        })
        // Verify OTP route
        this.router.post('/verify_otp', (req: Request, res: Response) => {
            this.auth_controller.verify_otp(req, res)
        })
    }
} 