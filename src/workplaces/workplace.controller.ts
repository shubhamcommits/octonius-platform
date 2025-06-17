// Import express types
import { Request, Response } from 'express'

// Import logger
import { appLogger } from '../logger'

// Import workplace service
import { WorkplaceService } from './workplace.service'

// Import response utils
import { sendError, sendResponse } from '../shared/response.utils'

export class WorkplaceController {
    private workplace_service: WorkplaceService

    constructor() {
        this.workplace_service = new WorkplaceService()
    }

    /**
     * Gets all workplaces for a user
     * @param req - Express request object containing user UUID
     * @param res - Express response object
     * @returns Array of workplaces or error response
     */
    async getUserWorkplaces(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            appLogger('Getting user workplaces', { 
                method: req.method, 
                path: req.path, 
                params: req.params,
                ip: req.ip 
            })

            // Get user UUID from params
            const { user_id } = req.params

            // Get workplaces using service
            const result = await this.workplace_service.getUserWorkplaces(user_id)

            // Return the result
            if (result.success) {
                return sendResponse(req as any, res, result.code, {
                    success: true,
                    message: result.message,
                    workplaces: result.workplaces
                })
            } else {
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {
            // Return error response
            return sendError(res, error.stack, error.message, error.code)
        }
    }

    /**
     * Gets all users in a workplace
     * @param req - Express request object containing workplace UUID
     * @param res - Express response object
     * @returns Array of users or error response
     */
    async getWorkplaceUsers(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            appLogger('Getting workplace users', { 
                method: req.method, 
                path: req.path, 
                params: req.params,
                ip: req.ip 
            })

            // Get workplace UUID from params
            const { workplace_id } = req.params

            // Get users using service
            const result = await this.workplace_service.getWorkplaceUsers(workplace_id)

            // Return the result
            if (result.success) {
                return sendResponse(req as any, res, result.code, {
                    success: true,
                    message: result.message,
                    users: result.workplaces // Note: the service returns users in 'workplaces' field
                })
            } else {
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {
            // Return error response
            return sendError(res, error.stack, error.message, error.code)
        }
    }

    /**
     * Selects a workplace for a user (sets as current workplace)
     * @param req - Express request object containing user_id in body and workplace_id in params
     * @param res - Express response object
     * @returns Success or error response
     */
    async selectWorkplace(req: Request, res: Response): Promise<Response> {
        try {
            appLogger('Selecting workplace', {
                method: req.method,
                path: req.path,
                params: req.params,
                body: req.body,
                ip: req.ip
            })
            const { workplace_id } = req.params
            const { user_id } = req.body
            const result = await this.workplace_service.selectWorkplace(user_id, workplace_id)
            if (result.success) {
                return sendResponse(req as any, res, result.code, {
                    success: true,
                    message: result.message,
                    workplace: result.workplace
                })
            } else {
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {
            return sendError(res, error.stack, error.message, error.code)
        }
    }

    /**
     * Gets all workplaces
     * @param req - Express request object
     * @param res - Express response object
     * @returns Array of all workplaces or error response
     */
    async getAllWorkplaces(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            appLogger('Getting all workplaces', { 
                method: req.method, 
                path: req.path,
                ip: req.ip 
            })

            // Get all workplaces using service
            const result = await this.workplace_service.getAllWorkplaces()

            // Return the result
            if (result.success) {
                return sendResponse(req as any, res, result.code, {
                    success: true,
                    message: result.message,
                    workplaces: result.workplaces
                })
            } else {
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {
            // Return error response
            return sendError(res, error.stack, error.message, error.code)
        }
    }

    /**
     * Creates a new workplace
     * @param req - Express request object containing workplace data in body
     * @param res - Express response object
     * @returns Created workplace or error response
     */
    async createWorkplace(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            appLogger('Creating workplace', {
                method: req.method,
                path: req.path,
                body: req.body,
                ip: req.ip
            })

            // Extract data from request body
            const { name, logo_url, created_by } = req.body

            // Validate required fields
            if (!name || !created_by) {
                return sendError(res, new Error('Missing required fields'), 'Name and created_by are required', 400)
            }

            // Create workplace using service
            const result = await this.workplace_service.createWorkplace(name, created_by, logo_url)

            // Return the result
            if (result.success) {
                return sendResponse(req as any, res, result.code, {
                    success: true,
                    message: result.message,
                    workplace: result.workplace
                })
            } else {
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {
            // Return error response
            return sendError(res, error.stack, error.message, error.code)
        }
    }
} 