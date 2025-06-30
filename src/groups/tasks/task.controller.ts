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
} 