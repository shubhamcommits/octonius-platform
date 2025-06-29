// Import Required Modules
import { Request, Response } from 'express'
import { GroupService } from './group.service'
import { GroupCode } from './group.code'
import { sendError, sendValidationError } from '../shared/handle-error'
import { sendResponse } from '../shared/handle-response'
import logger from '../logger'

/**
 * Group Controller Class
 * Handles all group-related HTTP requests and responses
 */
export class GroupController {
    /**
     * Create a new work group
     * POST /api/workplace/groups
     */
    static async createGroup(req: Request, res: Response) {
        try {
            const { name, description, image_url, workplace_id, settings, metadata } = req.body
            const user_id = req.user?.uuid

            if (!user_id) {
                return sendError(res, 'User not authenticated', 'Authentication required', 401)
            }

            if (!name || !workplace_id) {
                return sendValidationError(res, {
                    name: name ? null : 'Group name is required',
                    workplace_id: workplace_id ? null : 'Workplace ID is required'
                })
            }

            const result = await GroupService.createGroup({
                name,
                description,
                image_url,
                workplace_id,
                created_by: user_id,
                settings,
                metadata
            })

            if (!result.success) {
                return sendError(res, result.stack, result.message, result.code)
            }

            return sendResponse(req, res, result.code, result)
        } catch (error) {
            logger.error('Error in createGroup controller:', error)
            return sendError(res, error, GroupCode.UNKNOWN_ERROR, 500)
        }
    }

    /**
     * Get all groups for a workplace
     * GET /api/workplace/groups
     */
    static async getGroups(req: Request, res: Response) {
        try {
            const { workplace_id } = req.query
            const user_id = req.user?.uuid

            if (!user_id) {
                return sendError(res, 'User not authenticated', 'Authentication required', 401)
            }

            if (!workplace_id || typeof workplace_id !== 'string') {
                return sendValidationError(res, {
                    workplace_id: 'Workplace ID is required as a query parameter'
                })
            }

            const result = await GroupService.getGroupsByWorkplace(workplace_id, user_id)

            if (!result.success) {
                return sendError(res, result.stack, result.message, result.code)
            }

            return sendResponse(req, res, result.code, result)
        } catch (error) {
            logger.error('Error in getGroups controller:', error)
            return sendError(res, error, GroupCode.UNKNOWN_ERROR, 500)
        }
    }

    /**
     * Get a specific group by UUID
     * GET /api/workplace/groups/:group_id
     */
    static async getGroup(req: Request, res: Response) {
        try {
            const { group_id } = req.params
            const user_id = req.user?.uuid

            if (!user_id) {
                return sendError(res, 'User not authenticated', 'Authentication required', 401)
            }

            if (!group_id) {
                return sendValidationError(res, {
                    group_id: 'Group ID is required'
                })
            }

            const result = await GroupService.getGroupById(group_id, user_id)

            if (!result.success) {
                return sendError(res, result.stack, result.message, result.code)
            }

            return sendResponse(req, res, result.code, result)
        } catch (error) {
            logger.error('Error in getGroup controller:', error)
            return sendError(res, error, GroupCode.UNKNOWN_ERROR, 500)
        }
    }

    /**
     * Update a group
     * PUT /api/workplace/groups/:group_id
     */
    static async updateGroup(req: Request, res: Response) {
        try {
            const { group_id } = req.params
            const { name, description, image_url, settings, metadata } = req.body
            const user_id = req.user?.uuid

            if (!user_id) {
                return sendError(res, 'User not authenticated', 'Authentication required', 401)
            }

            if (!group_id) {
                return sendValidationError(res, {
                    group_id: 'Group ID is required'
                })
            }

            const updateData: any = {}
            if (name !== undefined) updateData.name = name
            if (description !== undefined) updateData.description = description
            if (image_url !== undefined) updateData.image_url = image_url
            if (settings !== undefined) updateData.settings = settings
            if (metadata !== undefined) updateData.metadata = metadata

            if (Object.keys(updateData).length === 0) {
                return sendValidationError(res, {
                    body: 'At least one field must be provided for update'
                })
            }

            const result = await GroupService.updateGroup(group_id, updateData, user_id)

            if (!result.success) {
                return sendError(res, result.stack, result.message, result.code)
            }

            return sendResponse(req, res, result.code, result)
        } catch (error) {
            logger.error('Error in updateGroup controller:', error)
            return sendError(res, error, GroupCode.UNKNOWN_ERROR, 500)
        }
    }

    /**
     * Delete a group (soft delete)
     * DELETE /api/workplace/groups/:group_id
     */
    static async deleteGroup(req: Request, res: Response) {
        try {
            const { group_id } = req.params
            const user_id = req.user?.uuid

            if (!user_id) {
                return sendError(res, 'User not authenticated', 'Authentication required', 401)
            }

            if (!group_id) {
                return sendValidationError(res, {
                    group_id: 'Group ID is required'
                })
            }

            const result = await GroupService.deleteGroup(group_id, user_id)

            if (!result.success) {
                return sendError(res, result.stack, result.message, result.code)
            }

            return sendResponse(req, res, result.code, result)
        } catch (error) {
            logger.error('Error in deleteGroup controller:', error)
            return sendError(res, error, GroupCode.UNKNOWN_ERROR, 500)
        }
    }

    /**
     * Search groups by name
     * GET /api/workplace/groups/search
     */
    static async searchGroups(req: Request, res: Response) {
        try {
            const { workplace_id, q } = req.query
            const user_id = req.user?.uuid

            if (!user_id) {
                return sendError(res, 'User not authenticated', 'Authentication required', 401)
            }

            if (!workplace_id || typeof workplace_id !== 'string') {
                return sendValidationError(res, {
                    workplace_id: 'Workplace ID is required as a query parameter'
                })
            }

            if (!q || typeof q !== 'string') {
                return sendValidationError(res, {
                    q: 'Search query is required as a query parameter'
                })
            }

            const result = await GroupService.searchGroups(workplace_id, q, user_id)

            if (!result.success) {
                return sendError(res, result.stack, result.message, result.code)
            }

            return sendResponse(req, res, result.code, result)
        } catch (error) {
            logger.error('Error in searchGroups controller:', error)
            return sendError(res, error, GroupCode.UNKNOWN_ERROR, 500)
        }
    }

    /**
     * Add a member to a group
     * POST /api/workplace/groups/:group_id/members
     */
    static async addMember(req: Request, res: Response) {
        try {
            const { group_id } = req.params
            const { user_id, role } = req.body
            const added_by = req.user?.uuid

            if (!added_by) {
                return sendError(res, 'User not authenticated', 'Authentication required', 401)
            }

            if (!group_id) {
                return sendValidationError(res, {
                    group_id: 'Group ID is required'
                })
            }

            if (!user_id) {
                return sendValidationError(res, {
                    user_id: 'User ID is required'
                })
            }

            const memberRole = role && ['admin', 'member', 'viewer'].includes(role) ? role : 'member'

            const result = await GroupService.addMember(group_id, user_id, added_by, memberRole)

            if (!result.success) {
                return sendError(res, result.stack, result.message, result.code)
            }

            return sendResponse(req, res, result.code, result)
        } catch (error) {
            logger.error('Error in addMember controller:', error)
            return sendError(res, error, GroupCode.UNKNOWN_ERROR, 500)
        }
    }

    /**
     * Remove a member from a group
     * DELETE /api/workplace/groups/:group_id/members/:user_id
     */
    static async removeMember(req: Request, res: Response) {
        try {
            const { group_id, user_id } = req.params
            const removed_by = req.user?.uuid

            if (!removed_by) {
                return sendError(res, 'User not authenticated', 'Authentication required', 401)
            }

            if (!group_id) {
                return sendValidationError(res, {
                    group_id: 'Group ID is required'
                })
            }

            if (!user_id) {
                return sendValidationError(res, {
                    user_id: 'User ID is required'
                })
            }

            const result = await GroupService.removeMember(group_id, user_id, removed_by)

            if (!result.success) {
                return sendError(res, result.stack, result.message, result.code)
            }

            return sendResponse(req, res, result.code, result)
        } catch (error) {
            logger.error('Error in removeMember controller:', error)
            return sendError(res, error, GroupCode.UNKNOWN_ERROR, 500)
        }
    }
} 