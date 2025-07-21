// Import express types
import { Request, Response } from 'express'

// Import logger
import { appLogger } from '../logger'

// Import workplace service
import { WorkplaceService } from './workplace.service'

// Import response utils
import { sendError, sendResponse } from '../shared/response.utils'
import { sendValidationError } from '../shared/handle-error'
import { validateJSON, validateParameters } from '../shared/validators'
import logger from '../logger'

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

    /**
     * Gets a workplace by ID
     * @param req - Express request object containing workplace UUID
     * @param res - Express response object
     * @returns Workplace or error response
     */
    async getWorkplaceById(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            appLogger('Getting workplace by ID', { 
                method: req.method, 
                path: req.path, 
                params: req.params,
                ip: req.ip 
            })

            // Get workplace UUID from params
            const { workplace_id } = req.params

            // Get workplace using service
            const result = await this.workplace_service.getWorkplaceById(workplace_id)

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

    /**
     * Updates workplace settings
     * @param req - Express request object containing workplace UUID and update data
     * @param res - Express response object
     * @returns Updated workplace or error response
     */
    async updateWorkplaceSettings(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            appLogger('Updating workplace settings', { 
                method: req.method, 
                path: req.path, 
                params: req.params,
                body: req.body,
                ip: req.ip 
            })

            // Get workplace UUID from params
            const { workplace_id } = req.params
            const updateData = req.body

            // Validate required fields
            if (!updateData || Object.keys(updateData).length === 0) {
                return sendError(res, new Error('No update data provided'), 'No update data provided', 400)
            }

            // Update workplace using service
            const result = await this.workplace_service.updateWorkplaceSettings(workplace_id, updateData)

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

    /**
     * Gets workplace members with detailed information
     * @param req - Express request object containing workplace UUID
     * @param res - Express response object
     * @returns Array of workplace members or error response
     */
    async getWorkplaceMembers(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            appLogger('Getting workplace members', { 
                method: req.method, 
                path: req.path, 
                params: req.params,
                ip: req.ip 
            })

            // Get workplace UUID from params
            const { workplace_id } = req.params
            const current_user_id = req.user?.uuid

            if (!current_user_id) {
                return sendError(res, new Error('User not authenticated'), 'Authentication required', 401)
            }

            // Get pagination and search parameters
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = parseInt(req.query.offset as string) || 0;
            const search = req.query.search as string || '';

            // Get members using service
            const result = await this.workplace_service.getWorkplaceMembers(workplace_id, current_user_id, {
                limit,
                offset,
                search
            })

            // Return the result
            if (result.success) {
                return sendResponse(req as any, res, result.code, {
                    success: true,
                    message: result.message,
                    members: result.members
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
     * Gets workplace statistics
     * @param req - Express request object containing workplace UUID
     * @param res - Express response object
     * @returns Workplace statistics or error response
     */
    async getWorkplaceStats(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            appLogger('Getting workplace statistics', { 
                method: req.method, 
                path: req.path, 
                params: req.params,
                ip: req.ip 
            })

            // Get workplace UUID from params
            const { workplace_id } = req.params

            // Get statistics using service
            const result = await this.workplace_service.getWorkplaceStats(workplace_id)

            // Return the result
            if (result.success) {
                return sendResponse(req as any, res, result.code, {
                    success: true,
                    message: result.message,
                    stats: result.workplace
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
     * Creates and sends a workplace invitation
     * @param req - Express request object containing invitation details
     * @param res - Express response object
     * @returns Success or error response
     */
    async createInvitation(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            logger.info('Creating workplace invitation', { method: req.method, path: req.path, ip: req.ip })

            // Get the workplace ID from params and user from request
            const { workplace_id } = req.params
            const { email, role_id, message } = req.body
            const invited_by = req.user?.uuid

            // Validate parameters
            const errors: any = validateParameters({ workplace_id, email, role_id })
            if (errors.length > 0) {
                return sendValidationError(res, errors)
            }

            if (!invited_by) {
                return sendError(res, '', 'User not authenticated', 401)
            }

            // Create invitation
            const result = await this.workplace_service.createInvitation(
                workplace_id,
                email,
                invited_by,
                role_id,
                message
            )

            // Return the result
            if (result.success) {
                return sendResponse(req as any, res, result.code, {
                    success: true,
                    message: result.message,
                    invitation: result.workplace
                })
            } else {
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {
            logger.error('Failed to create invitation', { error })
            return sendError(res, error.stack, error.message, error.code || 500)
        }
    }

    /**
     * Gets all invitations for a workplace
     * @param req - Express request object
     * @param res - Express response object
     * @returns Array of invitations or error response
     */
    async getInvitations(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            logger.info('Getting workplace invitations', { method: req.method, path: req.path, ip: req.ip })

            // Get the workplace ID from params
            const { workplace_id } = req.params
            const { status } = req.query

            // Validate parameters
            if (!workplace_id) {
                return sendValidationError(res, { workplace_id: 'Workplace ID is required' })
            }

            // Get invitations
            const result = await this.workplace_service.getWorkplaceInvitations(
                workplace_id,
                status as 'pending' | 'accepted' | 'rejected' | 'expired' | undefined
            )

            // Return the result
            if (result.success) {
                return sendResponse(req as any, res, result.code, {
                    success: true,
                    message: result.message,
                    invitations: result.workplaces
                })
            } else {
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {
            logger.error('Failed to get invitations', { error })
            return sendError(res, error.stack, error.message, error.code || 500)
        }
    }

    /**
     * Verifies an invitation token and returns invitation details
     * @param req - Express request object with token
     * @param res - Express response object
     * @returns Invitation details or error response
     */
    async verifyInvitation(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            logger.info('Verifying workplace invitation', { method: req.method, path: req.path, ip: req.ip })

            // Get token from params
            const { token } = req.params

            // Verify invitation
            const result = await this.workplace_service.verifyInvitation(token)

            // Return the result
            if (result.success) {
                return sendResponse(req as any, res, result.code, result)
            } else {
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error) {
            logger.error('Failed to verify invitation', { error })
            return sendError(res, error, 'Failed to verify invitation', 500)
        }
    }

    /**
     * Accepts a workplace invitation
     * @param req - Express request object containing token
     * @param res - Express response object
     * @returns Success or error response
     */
    async acceptInvitation(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            logger.info('Accepting workplace invitation', { method: req.method, path: req.path, ip: req.ip })

            // Get token and email from body
            const { token, email } = req.body

            // Validate parameters
            const errors: any = validateParameters({ token, email })
            if (errors.length > 0) {
                return sendValidationError(res, errors)
            }

            // Accept invitation
            const result = await this.workplace_service.acceptInvitation(token, email)

            // Return the result
            if (result.success) {
                return sendResponse(req as any, res, result.code, {
                    success: true,
                    message: result.message,
                    data: result.workplace
                })
            } else {
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {
            logger.error('Failed to accept invitation', { error })
            return sendError(res, error.stack, error.message, error.code || 500)
        }
    }

    /**
     * Cancels a pending invitation
     * @param req - Express request object
     * @param res - Express response object
     * @returns Success or error response
     */
    async cancelInvitation(req: Request, res: Response): Promise<Response> {
        try {
            // Log the request
            logger.info('Cancelling workplace invitation', { method: req.method, path: req.path, ip: req.ip })

            // Get invitation ID from params and user from request
            const { invitation_id } = req.params
            const cancelled_by = req.user?.uuid

            // Validate parameters
            if (!invitation_id) {
                return sendValidationError(res, { invitation_id: 'Invitation ID is required' })
            }

            if (!cancelled_by) {
                return sendError(res, '', 'User not authenticated', 401)
            }

            // Cancel invitation
            const result = await this.workplace_service.cancelInvitation(invitation_id, cancelled_by)

            // Return the result
            if (result.success) {
                return sendResponse(req as any, res, result.code, {
                    success: true,
                    message: result.message
                })
            } else {
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {
            logger.error('Failed to cancel invitation', { error })
            return sendError(res, error.stack, error.message, error.code || 500)
        }
    }
} 