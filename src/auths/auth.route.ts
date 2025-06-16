// Import express
import { Router, Request, Response, NextFunction } from 'express'

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

        // Configure routes
        this.configure_routes()
    }

    /**
     * This function is responsible for configuring the routes for the AuthRoute
     */
    private configure_routes(): void {

        // Register route
        this.router.post('/register', (req: Request, res: Response, next: NextFunction) => {
            this.auth_controller.register(req, res, next)
        })

        // Login route
        this.router.post('/login', (req: Request, res: Response, next: NextFunction) => {
            this.auth_controller.request_otp(req, res, next)
        })

        // Setup workplace route
        this.router.post('/setup-workplace', (req: Request, res: Response, next: NextFunction) => {
            this.auth_controller.setup_workplace_and_user(req, res, next)
        })

        // Verify OTP route
        this.router.post('/verify-otp', (req: Request, res: Response, next: NextFunction) => {
            this.auth_controller.verify_otp(req, res, next)
        })

        // Request OTP route
        this.router.post('/request-otp', (req: Request, res: Response, next: NextFunction) => {
            this.auth_controller.request_otp(req, res, next)
        })

        // Refresh token route
        this.router.post('/refresh', (req: Request, res: Response, next: NextFunction) => {
            this.auth_controller.refresh(req, res, next)
        })
    }
} 