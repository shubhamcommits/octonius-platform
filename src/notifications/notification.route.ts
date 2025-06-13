// Router Module
import { Router, Request, Response, NextFunction } from 'express'

// Import Controllers
import { NotificationController } from './notification.controller'

// Export Notification Route
export class NotificationRoute {

    // Router Instance
    public router: Router

    // Notification Controller Instance
    public notification_controller: NotificationController

    // Constructor
    constructor() {
        
        // Initialize Router
        this.router = Router()

        // Initialize Notification Controller
        this.notification_controller = new NotificationController()

        // Configure Routes
        this.configureRoutes()
    }

    /**
     * This function is responsible for configuring the routes for the NotificationRoute
     */
    private configureRoutes(): void {

        // Email Notification Route
        this.router
            .post('/email', (req: Request, res: Response, next: NextFunction) => {
                this.notification_controller.sendEmailNotification(req, res, next)
            })
    }
}
