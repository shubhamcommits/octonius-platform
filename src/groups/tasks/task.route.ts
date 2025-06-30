// Importing the Router, Request, and Response from the express library
import { Router, Request, Response } from 'express'

// Import Task Controller
import { TaskController } from './task.controller'

// Import Task Service
import { TaskService } from './task.service'

// Import Auth Middleware
import { verifyAccessToken, isLoggedIn } from '../../middleware'

// Export Task Route
export class TaskRoute {
    // Router Instance
    public router: Router

    // Task Controller Instance
    public task_controller: TaskController

    // Constructor
    constructor() {
        // Initialize Router
        this.router = Router({ mergeParams: true }) // mergeParams to access parent route params

        // Initialize Task Controller with Task Service
        this.task_controller = new TaskController(new TaskService())

        // Configure Routes
        this.configureRoutes()
    }

    /**
     * This function is responsible for configuring the routes for the TaskRoute
     */
    private configureRoutes(): void {
        
        // Board routes - Get the entire board with columns and tasks
        this.router.get('/board',
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.task_controller.getBoard(req, res)
            }
        )

        // Column routes
        this.router
            // Create a new column
            .post('/columns',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.createColumn(req, res)
                }
            )

        // Specific column routes
        this.router
            // Update a column
            .put('/columns/:column_id',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.updateColumn(req, res)
                }
            )
            // Delete a column
            .delete('/columns/:column_id',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.deleteColumn(req, res)
                }
            )

        // Task routes
        this.router
            // Create a new task
            .post('/',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.createTask(req, res)
                }
            )

        // Get group members for assignment (must be before /:task_id route)
        this.router.get('/members',
            verifyAccessToken,
            isLoggedIn,
            (req: Request, res: Response) => {
                this.task_controller.getGroupMembers(req, res)
            }
        )

        // Specific task routes
        this.router
            // Get a specific task
            .get('/:task_id',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.getTask(req, res)
                }
            )
            // Update a task
            .put('/:task_id',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.updateTask(req, res)
                }
            )
            // Delete a task
            .delete('/:task_id',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.deleteTask(req, res)
                }
            )

        // Task action routes
        this.router
            // Move a task to a different column/position
            .post('/:task_id/move',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.moveTask(req, res)
                }
            )

        // Task comment routes
        this.router
            // Get task comments
            .get('/:task_id/comments',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.getTaskComments(req, res)
                }
            )
            // Create task comment
            .post('/:task_id/comments',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.createTaskComment(req, res)
                }
            )
            // Update task comment
            .put('/:task_id/comments/:comment_id',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.updateTaskComment(req, res)
                }
            )
            // Delete task comment
            .delete('/:task_id/comments/:comment_id',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.deleteTaskComment(req, res)
                }
            )

        // Time tracking routes
        this.router
            // Add time entry to task
            .post('/:task_id/time-entries',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.addTimeEntry(req, res)
                }
            )

        // Custom fields routes
        this.router
            // Update custom fields for task
            .put('/:task_id/custom-fields',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.updateCustomFields(req, res)
                }
            )

        // Assignee management routes
        this.router
            // Assign users to task
            .post('/:task_id/assignees',
                verifyAccessToken,
                isLoggedIn,
                (req: Request, res: Response) => {
                    this.task_controller.assignUsersToTask(req, res)
                }
            )
    }
} 