// Import Required Modules
import { Router, Request, Response } from 'express';
import { GroupActivityController } from './activity.controller';
import { GroupActivityService } from './activity.service';
import { verifyAccessToken } from '../../middleware/auth.middleware';

// Export Group Activity Route
export class GroupActivityRoute {
    // Router Instance
    public router: Router
    // Controller Instance
    public activity_controller: GroupActivityController

    // Constructor
    constructor() {
        // Initialize Router
        this.router = Router({ mergeParams: true })
        // Initialize Controller with Service
        this.activity_controller = new GroupActivityController(new GroupActivityService())
        // Configure Routes
        this.configureRoutes()
    }

    /**
     * This function is responsible for configuring the routes for the GroupActivityRoute
     */
    private configureRoutes(): void {
        // Apply authentication middleware to all routes
        this.router.use(verifyAccessToken)

        // List all activity posts for a group
        // GET /api/workplace/groups/:group_id/activity
        this.router.get('/', (req: Request, res: Response) => {
            this.activity_controller.list(req, res)
        })

        // Create a new activity post
        // POST /api/workplace/groups/:group_id/activity
        this.router.post('/', (req: Request, res: Response) => {
            this.activity_controller.create(req, res)
        })

        // Get a specific activity post
        // GET /api/workplace/groups/:group_id/activity/:post_id
        this.router.get('/:postId', (req: Request, res: Response) => {
            this.activity_controller.get(req, res)
        })

        // Update an activity post
        // PUT /api/workplace/groups/:group_id/activity/:post_id
        this.router.put('/:postId', (req: Request, res: Response) => {
            this.activity_controller.update(req, res)
        })

        // Delete an activity post
        // DELETE /api/workplace/groups/:group_id/activity/:post_id
        this.router.delete('/:postId', (req: Request, res: Response) => {
            this.activity_controller.delete(req, res)
        })

        // Like a post
        // POST /api/workplace/groups/:group_id/activity/:post_id/like
        this.router.post('/:postId/like', (req: Request, res: Response) => {
            this.activity_controller.like(req, res)
        })

        // Unlike a post
        // DELETE /api/workplace/groups/:group_id/activity/:post_id/like
        this.router.delete('/:postId/like', (req: Request, res: Response) => {
            this.activity_controller.unlike(req, res)
        })

        // Get like count
        // GET /api/workplace/groups/:group_id/activity/:post_id/like-count
        this.router.get('/:postId/like-count', (req: Request, res: Response) => {
            this.activity_controller.likeCount(req, res)
        })

        // List comments
        // GET /api/workplace/groups/:group_id/activity/:post_id/comments
        this.router.get('/:postId/comments', (req: Request, res: Response) => {
            this.activity_controller.listComments(req, res)
        })

        // Create comment
        // POST /api/workplace/groups/:group_id/activity/:post_id/comments
        this.router.post('/:postId/comments', (req: Request, res: Response) => {
            this.activity_controller.createComment(req, res)
        })

        // Delete comment
        // DELETE /api/workplace/groups/:group_id/activity/:post_id/comments/:commentId
        this.router.delete('/:postId/comments/:commentId', (req: Request, res: Response) => {
            this.activity_controller.deleteComment(req, res)
        })

        // Get comment count
        // GET /api/workplace/groups/:group_id/activity/:post_id/comment-count
        this.router.get('/:postId/comment-count', (req: Request, res: Response) => {
            this.activity_controller.commentCount(req, res)
        })
    }
} 