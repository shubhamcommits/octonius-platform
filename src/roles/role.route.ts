// Import Express Router
import { Router, Request, Response } from 'express'

// Import Role Controller
import roleController from './role.controller'

// Import Middleware
import { verifyAccessToken, isLoggedIn } from '../middleware/auth.middleware'
import { requirePermission } from '../shared/permission.util'

export class RoleRoute {
  public router: Router

  constructor() {
    this.router = Router()
    this.configureRoutes()
  }

  /**
   * Configure routes for role endpoints
   */
  private configureRoutes(): void {
    // Get all roles for a workplace
    this.router.get('/:workplace_id/roles',
      verifyAccessToken,
      isLoggedIn,
      (req: Request, res: Response) => {
        roleController.getWorkplaceRoles(req, res)
      }
    )

    // Get current user's role in a workplace
    this.router.get('/:workplace_id/user/role',
      verifyAccessToken,
      isLoggedIn,
      (req: Request, res: Response) => {
        roleController.getUserRole(req, res)
      }
    )

    // Create a new role
    this.router.post('/:workplace_id/roles',
      verifyAccessToken,
      isLoggedIn,
      requirePermission('role.create'),
      (req: Request, res: Response) => {
        roleController.createRole(req, res)
      }
    )

    // Update a role
    this.router.put('/roles/:role_id',
      verifyAccessToken,
      isLoggedIn,
      requirePermission('role.update'),
      (req: Request, res: Response) => {
        roleController.updateRole(req, res)
      }
    )

    // Delete a role
    this.router.delete('/roles/:role_id',
      verifyAccessToken,
      isLoggedIn,
      requirePermission('role.delete'),
      (req: Request, res: Response) => {
        roleController.deleteRole(req, res)
      }
    )

    // Assign a role to a user
    this.router.post('/:workplace_id/members/assign-role',
      verifyAccessToken,
      isLoggedIn,
      requirePermission('role.assign'),
      (req: Request, res: Response) => {
        roleController.assignRole(req, res)
      }
    )

    // Get system permissions
    this.router.get('/permissions',
      verifyAccessToken,
      isLoggedIn,
      (req: Request, res: Response) => {
        roleController.getSystemPermissions(req, res)
      }
    )
  }
}

export default new RoleRoute().router 