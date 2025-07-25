// Import Express
import { Request, Response } from 'express'

// Import Services
import { TaskService } from './task.service'

// Import Logger
import logger from '../../logger'

/**
 * Controller class for handling task-related HTTP requests.
 * This class acts as an interface between HTTP requests and the TaskService.
 */
export class TaskController {
    private readonly taskService: TaskService

    /**
     * Creates a new instance of TaskController.
     * 
     * @param taskService - The service responsible for task-related business logic
     */
    constructor(taskService: TaskService) {
        this.taskService = taskService
    }



    /**
     * Creates a new task in a group.
     * 
     * @param req - Express request object containing task data
     * @param res - Express response object
     * @returns Created task data or error response
     */
    async createTask(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Creating new task', {
                method: req.method,
                path: req.path,
                groupId: req.params.group_id,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id } = req.params
            const taskData = req.body
            const userId = req.user!.uuid // Middleware ensures user exists

            // Validates required fields
            if (!taskData.title?.trim()) {
                const responseTime = Date.now() - startTime
                logger.warn('Task creation failed - title required', {
                    responseTime: `${responseTime}ms`,
                    statusCode: 400
                })

                return res.status(400).json({
                    success: false,
                    message: 'Task title is required',
                    meta: {
                        responseTime: `${responseTime}ms`
                    }
                })
            }

            // Creates task using the service
            const result = await this.taskService.createTask(group_id, taskData, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful creation
            logger.info('Task created successfully', {
                taskId: result.task.uuid,
                groupId: group_id,
                responseTime: `${responseTime}ms`,
                statusCode: 201
            })

            // Returns success response with created task data
            return res.status(201).json({
                success: true,
                data: result.task,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in createTask controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                body: req.body
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to create task',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Retrieves the task board for a group.
     * 
     * @param req - Express request object
     * @param res - Express response object
     * @returns Board data with columns and tasks or error response
     */
    async getBoard(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Fetching task board', {
                method: req.method,
                path: req.path,
                groupId: req.params.group_id,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id } = req.params
            const userId = req.user!.uuid // Middleware ensures user exists

            // Retrieves board using the service
            const result = await this.taskService.getBoard(group_id, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful retrieval
            logger.info('Board retrieved successfully', {
                groupId: group_id,
                columnCount: result.board.columns.length,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with board data
            return res.status(200).json({
                success: true,
                data: result.board,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in getBoard controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to fetch board',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Retrieves a single task by its UUID.
     * 
     * @param req - Express request object
     * @param res - Express response object
     * @returns Task data or error response
     */
    async getTask(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Fetching task by UUID', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, task_id } = req.params

            // Retrieves task using the service
            const result = await this.taskService.getTask(group_id, task_id)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful retrieval
            logger.info('Task retrieved successfully', {
                taskId: task_id,
                groupId: group_id,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with task data
            return res.status(200).json({
                success: true,
                data: result.task,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in getTask controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                params: req.params
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to fetch task',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Updates an existing task.
     * 
     * @param req - Express request object containing update data
     * @param res - Express response object
     * @returns Updated task data or error response
     */
    async updateTask(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Updating task', {
                method: req.method,
                path: req.path,
                params: req.params,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, task_id } = req.params
            const updateData = req.body
            const userId = req.user!.uuid // Middleware ensures user exists

            // Updates task using the service
            const result = await this.taskService.updateTask(group_id, task_id, updateData, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful update
            logger.info('Task updated successfully', {
                taskId: task_id,
                groupId: group_id,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with updated task data
            return res.status(200).json({
                success: true,
                data: result.task,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in updateTask controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                params: req.params,
                body: req.body
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to update task',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Moves a task to a different column or position.
     * 
     * @param req - Express request object containing move data
     * @param res - Express response object
     * @returns Moved task data or error response
     */
    async moveTask(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Moving task', {
                method: req.method,
                path: req.path,
                params: req.params,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, task_id } = req.params
            const moveData = req.body
            
            // Validates user authentication
            const userId = req.user!.uuid // Middleware ensures user exists

            // Validates required fields
            if (!moveData.column_id || moveData.position === undefined) {
                const responseTime = Date.now() - startTime
                logger.warn('Task move failed - missing required fields', {
                    responseTime: `${responseTime}ms`,
                    statusCode: 400
                })

                return res.status(400).json({
                    success: false,
                    message: 'Column ID and position are required',
                    meta: {
                        responseTime: `${responseTime}ms`
                    }
                })
            }

            // Moves task using the service
            const result = await this.taskService.moveTask(group_id, task_id, moveData, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful move
            logger.info('Task moved successfully', {
                taskId: task_id,
                groupId: group_id,
                newColumnId: moveData.column_id,
                newPosition: moveData.position,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with moved task data
            return res.status(200).json({
                success: true,
                data: result.task,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in moveTask controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                params: req.params,
                body: req.body
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to move task',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Deletes a task.
     * 
     * @param req - Express request object
     * @param res - Express response object
     * @returns Success or error response
     */
    async deleteTask(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Deleting task', {
                method: req.method,
                path: req.path,
                params: req.params,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, task_id } = req.params
            
            // Validates user authentication
            const userId = req.user!.uuid // Middleware ensures user exists

            // Deletes task using the service
            const result = await this.taskService.deleteTask(group_id, task_id, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful deletion
            logger.info('Task deleted successfully', {
                taskId: task_id,
                groupId: group_id,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response
            return res.status(200).json({
                success: true,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in deleteTask controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                params: req.params
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to delete task',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Creates a new column for the task board.
     * 
     * @param req - Express request object containing column data
     * @param res - Express response object
     * @returns Created column data or error response
     */
    async createColumn(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Creating new column', {
                method: req.method,
                path: req.path,
                groupId: req.params.group_id,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id } = req.params
            const columnData = req.body
            
            // Validates user authentication
            const userId = req.user!.uuid // Middleware ensures user exists

            // Validates required fields
            if (!columnData.name?.trim()) {
                const responseTime = Date.now() - startTime
                logger.warn('Column creation failed - name required', {
                    responseTime: `${responseTime}ms`,
                    statusCode: 400
                })

                return res.status(400).json({
                    success: false,
                    message: 'Column name is required',
                    meta: {
                        responseTime: `${responseTime}ms`
                    }
                })
            }

            // Creates column using the service
            const result = await this.taskService.createColumn(group_id, columnData, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful creation
            logger.info('Column created successfully', {
                columnId: result.column.uuid,
                groupId: group_id,
                responseTime: `${responseTime}ms`,
                statusCode: 201
            })

            // Returns success response with created column data
            return res.status(201).json({
                success: true,
                data: result.column,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in createColumn controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                body: req.body
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to create column',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Updates an existing column.
     * 
     * @param req - Express request object containing update data
     * @param res - Express response object
     * @returns Updated column data or error response
     */
    async updateColumn(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Updating column', {
                method: req.method,
                path: req.path,
                params: req.params,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, column_id } = req.params
            const updateData = req.body
            
            // Validates user authentication
            const userId = req.user!.uuid // Middleware ensures user exists

            // Updates column using the service
            const result = await this.taskService.updateColumn(group_id, column_id, updateData, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful update
            logger.info('Column updated successfully', {
                columnId: column_id,
                groupId: group_id,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with updated column data
            return res.status(200).json({
                success: true,
                data: result.column,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in updateColumn controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                params: req.params,
                body: req.body
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to update column',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Deletes a column.
     * 
     * @param req - Express request object
     * @param res - Express response object
     * @returns Success or error response
     */
    async deleteColumn(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Deleting column', {
                method: req.method,
                path: req.path,
                params: req.params,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, column_id } = req.params
            
            // Validates user authentication
            const userId = req.user!.uuid // Middleware ensures user exists

            // Deletes column using the service
            const result = await this.taskService.deleteColumn(group_id, column_id, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful deletion
            logger.info('Column deleted successfully', {
                columnId: column_id,
                groupId: group_id,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response
            return res.status(200).json({
                success: true,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in deleteColumn controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                params: req.params
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to delete column',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Gets all comments for a specific task.
     * 
     * @param req - Express request object
     * @param res - Express response object
     * @returns Task comments or error response
     */
    async getTaskComments(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Fetching task comments', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, task_id } = req.params

            // Retrieves task comments using the service
            const result = await this.taskService.getTaskComments(group_id, task_id)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful retrieval
            logger.info('Task comments retrieved successfully', {
                taskId: task_id,
                groupId: group_id,
                commentCount: result.comments?.length || 0,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with comments
            return res.status(200).json({
                success: true,
                data: result.comments,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in getTaskComments controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                params: req.params
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to retrieve task comments',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Creates a new comment for a task.
     * 
     * @param req - Express request object containing comment data
     * @param res - Express response object
     * @returns Created comment or error response
     */
    async createTaskComment(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Creating task comment', {
                method: req.method,
                path: req.path,
                params: req.params,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, task_id } = req.params
            const commentData = req.body
            const userId = req.user!.uuid // Middleware ensures user exists

            // Validates required fields
            if (!commentData.content?.trim()) {
                const responseTime = Date.now() - startTime
                logger.warn('Task comment creation failed - content required', {
                    responseTime: `${responseTime}ms`,
                    statusCode: 400
                })

                return res.status(400).json({
                    success: false,
                    message: 'Comment content is required',
                    meta: {
                        responseTime: `${responseTime}ms`
                    }
                })
            }

            // Creates comment using the service
            const result = await this.taskService.createTaskComment(group_id, task_id, commentData, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful creation
            logger.info('Task comment created successfully', {
                commentId: result.comment?.uuid,
                taskId: task_id,
                groupId: group_id,
                responseTime: `${responseTime}ms`,
                statusCode: 201
            })

            // Returns success response with created comment
            return res.status(201).json({
                success: true,
                data: result.comment,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in createTaskComment controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                body: req.body
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to create task comment',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Updates an existing task comment.
     * 
     * @param req - Express request object containing update data
     * @param res - Express response object
     * @returns Updated comment or error response
     */
    async updateTaskComment(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Updating task comment', {
                method: req.method,
                path: req.path,
                params: req.params,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, task_id, comment_id } = req.params
            const updateData = req.body
            const userId = req.user!.uuid // Middleware ensures user exists

            // Validates required fields
            if (!updateData.content?.trim()) {
                const responseTime = Date.now() - startTime
                logger.warn('Task comment update failed - content required', {
                    responseTime: `${responseTime}ms`,
                    statusCode: 400
                })

                return res.status(400).json({
                    success: false,
                    message: 'Comment content is required',
                    meta: {
                        responseTime: `${responseTime}ms`
                    }
                })
            }

            // Updates comment using the service
            const result = await this.taskService.updateTaskComment(group_id, task_id, comment_id, updateData, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful update
            logger.info('Task comment updated successfully', {
                commentId: comment_id,
                taskId: task_id,
                groupId: group_id,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with updated comment
            return res.status(200).json({
                success: true,
                data: result.comment,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in updateTaskComment controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                params: req.params,
                body: req.body
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to update task comment',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Deletes a task comment.
     * 
     * @param req - Express request object
     * @param res - Express response object
     * @returns Success or error response
     */
    async deleteTaskComment(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Deleting task comment', {
                method: req.method,
                path: req.path,
                params: req.params,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, task_id, comment_id } = req.params
            const userId = req.user!.uuid // Middleware ensures user exists

            // Deletes comment using the service
            const result = await this.taskService.deleteTaskComment(group_id, task_id, comment_id, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful deletion
            logger.info('Task comment deleted successfully', {
                commentId: comment_id,
                taskId: task_id,
                groupId: group_id,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response
            return res.status(200).json({
                success: true,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in deleteTaskComment controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                params: req.params
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to delete task comment',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Adds a time entry to a task.
     * 
     * @param req - Express request object containing time entry data
     * @param res - Express response object
     * @returns Updated task or error response
     */
    async addTimeEntry(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Adding time entry to task', {
                method: req.method,
                path: req.path,
                params: req.params,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, task_id } = req.params
            const timeData = req.body
            const userId = req.user!.uuid // Middleware ensures user exists

            // Validates required fields
            if (!timeData.hours || timeData.hours <= 0) {
                const responseTime = Date.now() - startTime
                logger.warn('Time entry addition failed - valid hours required', {
                    responseTime: `${responseTime}ms`,
                    statusCode: 400
                })

                return res.status(400).json({
                    success: false,
                    message: 'Valid hours value is required',
                    meta: {
                        responseTime: `${responseTime}ms`
                    }
                })
            }

            // Adds time entry using the service
            const result = await this.taskService.addTimeEntry(group_id, task_id, timeData, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful addition
            logger.info('Time entry added successfully', {
                taskId: task_id,
                groupId: group_id,
                hours: timeData.hours,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with updated task
            return res.status(200).json({
                success: true,
                data: result.task,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in addTimeEntry controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                body: req.body
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to add time entry',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Updates custom fields for a task.
     * 
     * @param req - Express request object containing custom fields data
     * @param res - Express response object
     * @returns Updated task or error response
     */
    async updateCustomFields(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Updating task custom fields', {
                method: req.method,
                path: req.path,
                params: req.params,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, task_id } = req.params
            const customFields = req.body
            const userId = req.user!.uuid // Middleware ensures user exists

            // Validates that custom fields data is provided (allow empty object for field removal)
            if (customFields === null || customFields === undefined) {
                const responseTime = Date.now() - startTime
                logger.warn('Custom fields update failed - data is required', {
                    responseTime: `${responseTime}ms`,
                    statusCode: 400
                })

                return res.status(400).json({
                    success: false,
                    message: 'Custom fields data is required',
                    meta: {
                        responseTime: `${responseTime}ms`
                    }
                })
            }

            // Updates custom fields using the service
            const result = await this.taskService.updateCustomFields(group_id, task_id, customFields, userId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful update
            logger.info('Custom fields updated successfully', {
                taskId: task_id,
                groupId: group_id,
                fieldCount: Object.keys(customFields).length,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with updated task
            return res.status(200).json({
                success: true,
                data: result.task,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in updateCustomFields controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                body: req.body
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to update custom fields',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Assigns users to a task.
     * 
     * @param req - Express request object containing assignee data
     * @param res - Express response object
     * @returns Updated task or error response
     */
    async assignUsersToTask(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Assigning users to task', {
                method: req.method,
                path: req.path,
                params: req.params,
                userId: req.user?.uuid,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id, task_id } = req.params
            const { userIds } = req.body
            const assignedBy = req.user!.uuid // Middleware ensures user exists

            // Validates required fields
            if (!userIds || !Array.isArray(userIds)) {
                const responseTime = Date.now() - startTime
                logger.warn('Task assignment failed - user IDs required', {
                    responseTime: `${responseTime}ms`,
                    statusCode: 400
                })

                return res.status(400).json({
                    success: false,
                    message: 'User IDs array is required',
                    meta: {
                        responseTime: `${responseTime}ms`
                    }
                })
            }

            // Assigns users using the service
            const result = await this.taskService.assignUsersToTask(group_id, task_id, userIds, assignedBy)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful assignment
            logger.info('Users assigned to task successfully', {
                taskId: task_id,
                groupId: group_id,
                userIds,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with updated task
            return res.status(200).json({
                success: true,
                data: result.task,
                message: result.message,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in assignUsersToTask controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                body: req.body
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to assign users to task',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Gets group members who can be assigned to tasks.
     * 
     * @param req - Express request object
     * @param res - Express response object
     * @returns Group members or error response
     */
    async getGroupMembers(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Fetching group members for assignment', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            })

            // Extracts data from request
            const { group_id } = req.params

            // Gets group members using the service
            const result = await this.taskService.getGroupMembers(group_id)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful retrieval
            logger.info('Group members retrieved successfully', {
                groupId: group_id,
                memberCount: result.members.length,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with members
            return res.status(200).json({
                success: true,
                data: result.members,
                message: 'Group members retrieved successfully',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in getGroupMembers controller', {
                error: error.message || 'Unknown error',
                stack: error.stack,
                responseTime: `${responseTime}ms`,
                statusCode: error.code || 500,
                params: req.params
            })

            // Returns error response
            return res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Failed to retrieve group members',
                error: error.stack?.message || 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }
} 