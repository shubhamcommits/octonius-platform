// Import Models
import { Role } from './role.model'
import { Permission } from './permission.model'
import { RolePermission } from './role-permission.model'
import { WorkplaceMembership } from '../workplaces/workplace-membership.model'
import { DEFAULT_ROLES, SYSTEM_PERMISSIONS, roleHasPermission } from './permissions.constants'

// Import Logger
import logger from '../logger'

// Import types
import { Op } from 'sequelize'

// Define types
interface RoleResponse<T> {
  success: boolean
  message: string
  code: number
  data?: T
  error?: any
}

export class RoleService {
  /**
   * Creates default roles for a new workplace
   */
  static async createDefaultRoles(workplace_id: string, created_by: string): Promise<RoleResponse<Role[]>> {
    try {
      const roles: Role[] = []

      // Create Owner role
      const ownerRole = await Role.create({
        name: DEFAULT_ROLES.OWNER.name,
        description: DEFAULT_ROLES.OWNER.description,
        permissions: DEFAULT_ROLES.OWNER.permissions,
        is_system: true,
        workplace_id,
        active: true
      })
      roles.push(ownerRole)

      // Create Admin role
      const adminRole = await Role.create({
        name: DEFAULT_ROLES.ADMIN.name,
        description: DEFAULT_ROLES.ADMIN.description,
        permissions: DEFAULT_ROLES.ADMIN.permissions,
        is_system: true,
        workplace_id,
        active: true
      })
      roles.push(adminRole)

      // Create Member role
      const memberRole = await Role.create({
        name: DEFAULT_ROLES.MEMBER.name,
        description: DEFAULT_ROLES.MEMBER.description,
        permissions: DEFAULT_ROLES.MEMBER.permissions,
        is_system: true,
        workplace_id,
        active: true
      })
      roles.push(memberRole)

      logger.info('Default roles created for workplace', { workplace_id, roles: roles.map(r => r.name) })

      return {
        success: true,
        message: 'Default roles created successfully',
        code: 201,
        data: roles
      }
    } catch (error) {
      logger.error('Failed to create default roles', { error, workplace_id })
      return {
        success: false,
        message: 'Failed to create default roles',
        code: 500,
        error
      }
    }
  }

  /**
   * Get all roles for a workplace
   */
  static async getWorkplaceRoles(workplace_id: string): Promise<RoleResponse<Role[]>> {
    try {
      const roles = await Role.findAll({
        where: {
          workplace_id,
          active: true
        },
        order: [
          ['is_system', 'DESC'],
          ['name', 'ASC']
        ]
      })

      return {
        success: true,
        message: 'Roles retrieved successfully',
        code: 200,
        data: roles
      }
    } catch (error) {
      logger.error('Failed to get workplace roles', { error, workplace_id })
      return {
        success: false,
        message: 'Failed to get roles',
        code: 500,
        error
      }
    }
  }

  /**
   * Create a new custom role
   */
  static async createRole(
    workplace_id: string,
    name: string,
    description: string,
    permissions: string[],
    created_by: string
  ): Promise<RoleResponse<Role>> {
    try {
      // Check if user has permission to create roles
      const canCreate = await this.checkUserPermission(created_by, workplace_id, 'role.create')
      if (!canCreate) {
        return {
          success: false,
          message: 'You do not have permission to create roles',
          code: 403
        }
      }

      // Check if role name already exists in workplace
      const existingRole = await Role.findOne({
        where: {
          name: name.toLowerCase(),
          workplace_id
        }
      })

      if (existingRole) {
        return {
          success: false,
          message: 'A role with this name already exists',
          code: 409
        }
      }

      // Create the role
      const role = await Role.create({
        name: name.toLowerCase(),
        description,
        permissions,
        is_system: false,
        workplace_id,
        active: true
      })

      logger.info('Custom role created', { workplace_id, role_name: name, created_by })

      return {
        success: true,
        message: 'Role created successfully',
        code: 201,
        data: role
      }
    } catch (error) {
      logger.error('Failed to create role', { error, workplace_id, name })
      return {
        success: false,
        message: 'Failed to create role',
        code: 500,
        error
      }
    }
  }

  /**
   * Update an existing role
   */
  static async updateRole(
    role_id: string,
    updates: {
      name?: string
      description?: string
      permissions?: string[]
    },
    updated_by: string
  ): Promise<RoleResponse<Role>> {
    try {
      const role = await Role.findByPk(role_id)
      if (!role) {
        return {
          success: false,
          message: 'Role not found',
          code: 404
        }
      }

      // Check if user has permission to update roles
      const canUpdate = role.workplace_id ? await this.checkUserPermission(updated_by, role.workplace_id, 'role.update') : false
      if (!canUpdate) {
        return {
          success: false,
          message: 'You do not have permission to update roles',
          code: 403
        }
      }

      // Prevent updating system roles
      if (role.is_system) {
        return {
          success: false,
          message: 'System roles cannot be modified',
          code: 403
        }
      }

      // Update the role
      await role.update({
        name: updates.name?.toLowerCase() || role.name,
        description: updates.description || role.description,
        permissions: updates.permissions || role.permissions
      })

      logger.info('Role updated', { role_id, updates, updated_by })

      return {
        success: true,
        message: 'Role updated successfully',
        code: 200,
        data: role
      }
    } catch (error) {
      logger.error('Failed to update role', { error, role_id })
      return {
        success: false,
        message: 'Failed to update role',
        code: 500,
        error
      }
    }
  }

  /**
   * Delete a role
   */
  static async deleteRole(role_id: string, deleted_by: string): Promise<RoleResponse<null>> {
    try {
      const role = await Role.findByPk(role_id)
      if (!role) {
        return {
          success: false,
          message: 'Role not found',
          code: 404
        }
      }

      // Check if user has permission to delete roles
      const canDelete = role.workplace_id ? await this.checkUserPermission(deleted_by, role.workplace_id, 'role.delete') : false
      if (!canDelete) {
        return {
          success: false,
          message: 'You do not have permission to delete roles',
          code: 403
        }
      }

      // Prevent deleting system roles
      if (role.is_system) {
        return {
          success: false,
          message: 'System roles cannot be deleted',
          code: 403
        }
      }

      // Check if role is in use
      const membersWithRole = await WorkplaceMembership.count({
        where: {
          role_id,
          status: 'active'
        }
      })

      if (membersWithRole > 0) {
        return {
          success: false,
          message: `Cannot delete role. ${membersWithRole} members are assigned to this role`,
          code: 409
        }
      }

      // Soft delete the role
      await role.update({ active: false })

      logger.info('Role deleted', { role_id, deleted_by })

      return {
        success: true,
        message: 'Role deleted successfully',
        code: 200
      }
    } catch (error) {
      logger.error('Failed to delete role', { error, role_id })
      return {
        success: false,
        message: 'Failed to delete role',
        code: 500,
        error
      }
    }
  }

  /**
   * Assign a role to a user
   */
  static async assignRole(
    user_id: string,
    workplace_id: string,
    role_id: string,
    assigned_by: string
  ): Promise<RoleResponse<WorkplaceMembership>> {
    try {
      // Check if user has permission to assign roles
      const canAssign = await this.checkUserPermission(assigned_by, workplace_id, 'role.assign')
      if (!canAssign) {
        return {
          success: false,
          message: 'You do not have permission to assign roles',
          code: 403
        }
      }

      // Check if role exists and belongs to workplace
      const role = await Role.findOne({
        where: {
          uuid: role_id,
          workplace_id,
          active: true
        }
      })

      if (!role) {
        return {
          success: false,
          message: 'Role not found',
          code: 404
        }
      }

      // Find the membership
      const membership = await WorkplaceMembership.findOne({
        where: {
          user_id,
          workplace_id
        }
      })

      if (!membership) {
        return {
          success: false,
          message: 'User is not a member of this workplace',
          code: 404
        }
      }

      // Prevent changing owner role unless by another owner
      const currentRole = await Role.findByPk(membership.role_id)
      if (currentRole?.name === 'owner') {
        const assignerRole = await this.getUserRole(assigned_by, workplace_id)
        if (assignerRole?.name !== 'owner') {
          return {
            success: false,
            message: 'Only owners can change owner roles',
            code: 403
          }
        }
      }

      // Update the membership
      await membership.update({ role_id })

      logger.info('Role assigned', { user_id, role_id, workplace_id, assigned_by })

      return {
        success: true,
        message: 'Role assigned successfully',
        code: 200,
        data: membership
      }
    } catch (error) {
      logger.error('Failed to assign role', { error, user_id, role_id })
      return {
        success: false,
        message: 'Failed to assign role',
        code: 500,
        error
      }
    }
  }

  /**
   * Check if a user has a specific permission in a workplace
   */
  static async checkUserPermission(
    user_id: string,
    workplace_id: string,
    permission: string
  ): Promise<boolean> {
    try {
      const membership = await WorkplaceMembership.findOne({
        where: {
          user_id,
          workplace_id,
          status: 'active'
        },
        include: [{
          model: Role,
          as: 'role'
        }]
      })

      if (!membership) {
        return false
      }

      const role = membership.get('role') as Role
      return roleHasPermission(role.permissions, permission)
    } catch (error) {
      logger.error('Failed to check user permission', { error, user_id, permission })
      return false
    }
  }

  /**
   * Get user's role in a workplace
   */
  static async getUserRole(user_id: string, workplace_id: string): Promise<Role | null> {
    try {
      const membership = await WorkplaceMembership.findOne({
        where: {
          user_id,
          workplace_id,
          status: 'active'
        },
        include: [{
          model: Role,
          as: 'role'
        }]
      })

      if (!membership) {
        return null
      }

      return membership.get('role') as Role
    } catch (error) {
      logger.error('Failed to get user role', { error, user_id, workplace_id })
      return null
    }
  }

  /**
   * Initialize system permissions in the database
   */
  static async initializeSystemPermissions(): Promise<void> {
    try {
      const permissions = Object.values(SYSTEM_PERMISSIONS)

      for (const permission of permissions) {
        await Permission.findOrCreate({
          where: {
            module: permission.module,
            action: permission.action
          },
          defaults: {
            name: permission.name,
            description: permission.description,
            category: permission.category,
            module: permission.module,
            action: permission.action,
            is_system: true,
            active: true
          }
        })
      }

      logger.info('System permissions initialized')
    } catch (error) {
      logger.error('Failed to initialize system permissions', { error })
    }
  }
}

export default RoleService 