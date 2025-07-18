// Import Express Types
import { Request, Response } from 'express'

// Import Role Service
import RoleService from './role.service'

// Import Response Utilities
import { sendResponse } from '../shared/handle-response'
import { sendError, sendValidationError } from '../shared/handle-error'
import { validateParameters } from '../shared/validators'

// Import Logger
import logger from '../logger'

export class RoleController {
  /**
   * Get all roles for a workplace
   */
  async getWorkplaceRoles(req: Request, res: Response): Promise<Response> {
    try {
      const { workplace_id } = req.params

      // Validate parameters
      const errors = validateParameters({ workplace_id })
      if (errors.length > 0) {
        return sendValidationError(res, errors)
      }

      // Get roles
      const result = await RoleService.getWorkplaceRoles(workplace_id)

      if (result.success) {
        return sendResponse(req as any, res, result.code, {
          success: true,
          message: result.message,
          roles: result.data
        })
      } else {
        return sendError(res, result.error, result.message, result.code)
      }
    } catch (error: any) {
      logger.error('Failed to get workplace roles', { error })
      return sendError(res, error, 'Failed to get roles', 500)
    }
  }

  /**
   * Create a new role
   */
  async createRole(req: Request, res: Response): Promise<Response> {
    try {
      const { workplace_id } = req.params
      const { name, description, permissions } = req.body
      const created_by = req.user?.uuid

      // Validate parameters
      const errors = validateParameters({ workplace_id, name, description, permissions })
      if (errors.length > 0) {
        return sendValidationError(res, errors)
      }

      if (!created_by) {
        return sendError(res, '', 'User not authenticated', 401)
      }

      // Validate permissions array
      if (!Array.isArray(permissions)) {
        return sendError(res, '', 'Permissions must be an array', 400)
      }

      // Create role
      const result = await RoleService.createRole(
        workplace_id,
        name,
        description,
        permissions,
        created_by
      )

      if (result.success) {
        return sendResponse(req as any, res, result.code, {
          success: true,
          message: result.message,
          role: result.data
        })
      } else {
        return sendError(res, result.error, result.message, result.code)
      }
    } catch (error: any) {
      logger.error('Failed to create role', { error })
      return sendError(res, error, 'Failed to create role', 500)
    }
  }

  /**
   * Update a role
   */
  async updateRole(req: Request, res: Response): Promise<Response> {
    try {
      const { role_id } = req.params
      const { name, description, permissions } = req.body
      const updated_by = req.user?.uuid

      // Validate parameters
      const errors = validateParameters({ role_id })
      if (errors.length > 0) {
        return sendValidationError(res, errors)
      }

      if (!updated_by) {
        return sendError(res, '', 'User not authenticated', 401)
      }

      // Prepare updates
      const updates: any = {}
      if (name !== undefined) updates.name = name
      if (description !== undefined) updates.description = description
      if (permissions !== undefined) {
        if (!Array.isArray(permissions)) {
          return sendError(res, '', 'Permissions must be an array', 400)
        }
        updates.permissions = permissions
      }

      // Update role
      const result = await RoleService.updateRole(role_id, updates, updated_by)

      if (result.success) {
        return sendResponse(req as any, res, result.code, {
          success: true,
          message: result.message,
          role: result.data
        })
      } else {
        return sendError(res, result.error, result.message, result.code)
      }
    } catch (error: any) {
      logger.error('Failed to update role', { error })
      return sendError(res, error, 'Failed to update role', 500)
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(req: Request, res: Response): Promise<Response> {
    try {
      const { role_id } = req.params
      const deleted_by = req.user?.uuid

      // Validate parameters
      const errors = validateParameters({ role_id })
      if (errors.length > 0) {
        return sendValidationError(res, errors)
      }

      if (!deleted_by) {
        return sendError(res, '', 'User not authenticated', 401)
      }

      // Delete role
      const result = await RoleService.deleteRole(role_id, deleted_by)

      if (result.success) {
        return sendResponse(req as any, res, result.code, {
          success: true,
          message: result.message
        })
      } else {
        return sendError(res, result.error, result.message, result.code)
      }
    } catch (error: any) {
      logger.error('Failed to delete role', { error })
      return sendError(res, error, 'Failed to delete role', 500)
    }
  }

  /**
   * Assign a role to a user
   */
  async assignRole(req: Request, res: Response): Promise<Response> {
    try {
      const { workplace_id } = req.params
      const { user_id, role_id } = req.body
      const assigned_by = req.user?.uuid

      // Validate parameters
      const errors = validateParameters({ workplace_id, user_id, role_id })
      if (errors.length > 0) {
        return sendValidationError(res, errors)
      }

      if (!assigned_by) {
        return sendError(res, '', 'User not authenticated', 401)
      }

      // Assign role
      const result = await RoleService.assignRole(user_id, workplace_id, role_id, assigned_by)

      if (result.success) {
        return sendResponse(req as any, res, result.code, {
          success: true,
          message: result.message,
          membership: result.data
        })
      } else {
        return sendError(res, result.error, result.message, result.code)
      }
    } catch (error: any) {
      logger.error('Failed to assign role', { error })
      return sendError(res, error, 'Failed to assign role', 500)
    }
  }

  /**
   * Get all system permissions
   */
  async getSystemPermissions(req: Request, res: Response): Promise<Response> {
    try {
      const { SYSTEM_PERMISSIONS, PERMISSION_CATEGORIES } = await import('./permissions.constants')

      // Group permissions by category
      const permissionsByCategory: any = {}
      Object.values(PERMISSION_CATEGORIES).forEach(category => {
        permissionsByCategory[category] = []
      })

      Object.values(SYSTEM_PERMISSIONS).forEach(permission => {
        if (permissionsByCategory[permission.category]) {
          permissionsByCategory[permission.category].push(permission)
        }
      })

      return sendResponse(req as any, res, 200, {
        success: true,
        message: 'Permissions retrieved successfully',
        permissions: permissionsByCategory,
        categories: PERMISSION_CATEGORIES
      })
    } catch (error: any) {
      logger.error('Failed to get system permissions', { error })
      return sendError(res, error, 'Failed to get permissions', 500)
    }
  }
}

export default new RoleController() 