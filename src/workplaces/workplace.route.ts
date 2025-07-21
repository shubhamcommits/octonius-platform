// Import express
import { Router, Request, Response } from 'express'

// Import workplace controller
import { WorkplaceController } from './workplace.controller'

// Import Auth Middleware
import { verifyAccessToken, isLoggedIn } from '../middleware'
import { requirePermission } from '../shared/permission.util'

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

        // Get workplace by ID (requires auth)
        this.router.get('/:workplace_id', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.workplace_controller.getWorkplaceById(req, res)
            }
        )

        // Update workplace settings (requires auth and permission)
        this.router.put('/:workplace_id/settings', 
            verifyAccessToken,
            isLoggedIn,
            requirePermission('workplace.update'),
            (req: Request, res: Response) => {
                this.workplace_controller.updateWorkplaceSettings(req, res)
            }
        )

        // Get workplace statistics (requires auth)
        this.router.get('/:workplace_id/stats', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.workplace_controller.getWorkplaceStats(req, res)
            }
        )

        // Get workplace members (requires auth)
        this.router.get('/:workplace_id/members', 
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.workplace_controller.getWorkplaceMembers(req, res)
            }
        )

        // Create workplace invitation route - requires authentication and permission
        this.router.post(
            '/:workplace_id/invitations',
            verifyAccessToken,
            isLoggedIn,
            requirePermission('user.invite'),
            (req: Request, res: Response) => {
                this.workplace_controller.createInvitation(req, res)
            }
        )

        // Get workplace invitations route - requires authentication
        this.router.get(
            '/:workplace_id/invitations',
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.workplace_controller.getInvitations(req, res)
            }
        )

        // Verify workplace invitation route - no authentication required
        this.router.get(
            '/invitations/verify/:token',
            (req: Request, res: Response) => {
                this.workplace_controller.verifyInvitation(req, res)
            }
        )

        // Accept workplace invitation route - no authentication required
        this.router.post(
            '/invitations/accept',
            (req: Request, res: Response) => {
                this.workplace_controller.acceptInvitation(req, res)
            }
        )

        // Cancel workplace invitation route - requires authentication
        this.router.delete(
            '/invitations/:invitation_id',
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.workplace_controller.cancelInvitation(req, res)
            }
        )
    }
} 