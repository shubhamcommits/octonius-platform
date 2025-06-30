// Import Required Modules
import { Router, Request, Response } from 'express'
import { GroupController } from './group.controller'
import { verifyAccessToken } from '../middleware/auth.middleware'
import { GroupActivityRoute } from './activity/activity.route'
import { TaskRoute } from './tasks/task.route'

// Export Group Route
export class GroupRoute {
    // Router Instance
    public router: Router

    // Constructor
    constructor() {
        // Initialize Router
        this.router = Router()
        // Configure Routes
        this.configureRoutes()
    }

    /**
     * This function is responsible for configuring the routes for the GroupRoute
     */
    private configureRoutes(): void {
        // Apply authentication middleware to all routes
        this.router.use(verifyAccessToken)

        // Create a new work group
        // POST /api/workplace/groups
        this.router.post('/', (req: Request, res: Response) => {
            GroupController.createGroup(req, res)
        })

        // Get all groups for a workplace
        // GET /api/workplace/groups?workplace_id=uuid
        this.router.get('/', (req: Request, res: Response) => {
            GroupController.getGroups(req, res)
        })

        // Search groups by name
        // GET /api/workplace/groups/search?workplace_id=uuid&q=search_term
        this.router.get('/search', (req: Request, res: Response) => {
            GroupController.searchGroups(req, res)
        })

        // Get a specific group by UUID
        // GET /api/workplace/groups/:group_id
        this.router.get('/:group_id', (req: Request, res: Response) => {
            GroupController.getGroup(req, res)
        })

        // Update a group
        // PUT /api/workplace/groups/:group_id
        this.router.put('/:group_id', (req: Request, res: Response) => {
            GroupController.updateGroup(req, res)
        })

        // Delete a group (soft delete)
        // DELETE /api/workplace/groups/:group_id
        this.router.delete('/:group_id', (req: Request, res: Response) => {
            GroupController.deleteGroup(req, res)
        })

        // Add a member to a group
        // POST /api/workplace/groups/:group_id/members
        this.router.post('/:group_id/members', (req: Request, res: Response) => {
            GroupController.addMember(req, res)
        })

        // Remove a member from a group
        // DELETE /api/workplace/groups/:group_id/members/:user_id
        this.router.delete('/:group_id/members/:user_id', (req: Request, res: Response) => {
            GroupController.removeMember(req, res)
        })

        // Mount activity sub-route
        // All activity endpoints: /api/workplace/groups/:group_id/activity
        const activityRoute = new GroupActivityRoute()
        this.router.use('/:group_id/activity', activityRoute.router)

        // Mount task sub-route
        // All task endpoints: /api/workplace/groups/:group_id/tasks
        const taskRoute = new TaskRoute()
        this.router.use('/:group_id/tasks', taskRoute.router)
    }
} 