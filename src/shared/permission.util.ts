import { Request, Response, NextFunction } from 'express'
import RoleService from '../roles/role.service'
import { sendError } from './handle-error'
import logger from '../logger'

/**
 * Middleware to check if user has required permission
 * @param permission - The permission to check
 * @returns Express middleware function
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        sendError(res, '', 'Authentication required', 401)
        return
      }

      // Check if workplace is selected
      if (!req.user.current_workplace_id) {
        sendError(res, '', 'No workplace selected', 400)
        return
      }

      // Check permission
      const hasPermission = await RoleService.checkUserPermission(
        req.user.uuid,
        req.user.current_workplace_id,
        permission
      )

      if (!hasPermission) {
        logger.warn('Permission denied', {
          user_id: req.user.uuid,
          workplace_id: req.user.current_workplace_id,
          permission,
          path: req.path
        })
        sendError(res, '', 'Insufficient permissions', 403)
        return
      }

      next()
    } catch (error) {
      logger.error('Permission check failed', { error, permission })
      sendError(res, error, 'Permission check failed', 500)
    }
  }
}

/**
 * Middleware to check if user has any of the required permissions
 * @param permissions - Array of permissions (user needs at least one)
 * @returns Express middleware function
 */
export function requireAnyPermission(permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        sendError(res, '', 'Authentication required', 401)
        return
      }

      // Check if workplace is selected
      if (!req.user.current_workplace_id) {
        sendError(res, '', 'No workplace selected', 400)
        return
      }

      // Check permissions
      for (const permission of permissions) {
        const hasPermission = await RoleService.checkUserPermission(
          req.user.uuid,
          req.user.current_workplace_id,
          permission
        )
        
        if (hasPermission) {
          next()
          return
        }
      }

      logger.warn('All permissions denied', {
        user_id: req.user.uuid,
        workplace_id: req.user.current_workplace_id,
        permissions,
        path: req.path
      })
      sendError(res, '', 'Insufficient permissions', 403)
    } catch (error) {
      logger.error('Permission check failed', { error, permissions })
      sendError(res, error, 'Permission check failed', 500)
    }
  }
}

/**
 * Middleware to check if user has all of the required permissions
 * @param permissions - Array of permissions (user needs all)
 * @returns Express middleware function
 */
export function requireAllPermissions(permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        sendError(res, '', 'Authentication required', 401)
        return
      }

      // Check if workplace is selected
      if (!req.user.current_workplace_id) {
        sendError(res, '', 'No workplace selected', 400)
        return
      }

      // Check all permissions
      for (const permission of permissions) {
        const hasPermission = await RoleService.checkUserPermission(
          req.user.uuid,
          req.user.current_workplace_id,
          permission
        )
        
        if (!hasPermission) {
          logger.warn('Permission denied', {
            user_id: req.user.uuid,
            workplace_id: req.user.current_workplace_id,
            permission,
            path: req.path
          })
          sendError(res, '', 'Insufficient permissions', 403)
          return
        }
      }

      next()
    } catch (error) {
      logger.error('Permission check failed', { error, permissions })
      sendError(res, error, 'Permission check failed', 500)
    }
  }
} 