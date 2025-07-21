import { Permission } from './permission.model';
import { Role } from './role.model';
import { RolePermission } from './role-permission.model';
import { SYSTEM_PERMISSIONS, DEFAULT_ROLES } from './permissions.constants';
import logger from '../logger';

/**
 * Initialize system permissions and default roles
 */
export async function initializePermissionsAndRoles(): Promise<void> {
  try {
    logger.info('Starting permission and role initialization...');

    // 1. Initialize system permissions
    await initializeSystemPermissions();
    
    // 2. Create default roles for existing workplaces
    await createDefaultRolesForWorkplaces();

    logger.info('Permission and role initialization completed');
  } catch (error) {
    logger.error('Failed to initialize permissions and roles', { error });
    throw error;
  }
}

/**
 * Initialize system permissions in the database
 */
async function initializeSystemPermissions(): Promise<void> {
  try {
    const permissions = Object.values(SYSTEM_PERMISSIONS);

    for (const permission of permissions) {
      const [created] = await Permission.findOrCreate({
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
      });

      if (created) {
        logger.info(`Created permission: ${permission.name}`);
      }
    }

    logger.info('System permissions initialized');
  } catch (error) {
    logger.error('Failed to initialize system permissions', { error });
    throw error;
  }
}

/**
 * Create default roles for existing workplaces
 */
async function createDefaultRolesForWorkplaces(): Promise<void> {
  try {
    // Get all workplaces that don't have default roles
    const { Workplace } = await import('../workplaces/workplace.model');
    
    const workplaces = await Workplace.findAll({
      where: { active: true }
    });

    for (const workplace of workplaces) {
      await createDefaultRolesForWorkplace(workplace.uuid);
    }

    logger.info('Default roles created for existing workplaces');
  } catch (error) {
    logger.error('Failed to create default roles for workplaces', { error });
    throw error;
  }
}

/**
 * Create default roles for a specific workplace
 */
async function createDefaultRolesForWorkplace(workplace_id: string): Promise<void> {
  try {
    // Check if default roles already exist
    const existingRoles = await Role.findAll({
      where: {
        workplace_id,
        is_system: true
      }
    });

    if (existingRoles.length > 0) {
      logger.info(`Default roles already exist for workplace: ${workplace_id}`);
      return;
    }

    // Use RoleService to create default roles with permissions
    const RoleService = await import('./role.service').then(m => m.default)
    const result = await RoleService.createDefaultRoles(workplace_id, 'system')
    
    if (result.success) {
      logger.info(`Default roles created for workplace: ${workplace_id}`);
    } else {
      logger.error(`Failed to create default roles for workplace: ${workplace_id}`, { error: result.error })
    }
  } catch (error) {
    logger.error('Failed to create default roles for workplace', { error, workplace_id });
    throw error;
  }
}

/**
 * Get role permissions from role_permissions table
 */
export async function getRolePermissions(role_id: string): Promise<string[]> {
  try {
    const rolePermissions = await RolePermission.findAll({
      where: {
        role_id,
        active: true
      },
      include: [{
        model: Permission,
        as: 'permission',
        where: { active: true }
      }]
    });

    const permissionNames = rolePermissions.map(rp => (rp as any).permission.name);
    
    // If the role has all permissions (wildcard), return ['*'] for consistency
    const totalPermissions = await Permission.count({ where: { active: true } });
    if (permissionNames.length === totalPermissions && totalPermissions > 0) {
      return ['*'];
    }
    
    return permissionNames;
  } catch (error) {
    logger.error('Failed to get role permissions', { error, role_id });
    return [];
  }
}

/**
 * Update role permissions using role_permissions table
 */
export async function updateRolePermissions(
  role_id: string, 
  permission_names: string[], 
  granted_by: string
): Promise<void> {
  try {
    // Handle wildcard permission (*) - give access to all permissions
    if (permission_names.includes('*')) {
      // Get all active permissions
      const allPermissions = await Permission.findAll({
        where: { active: true }
      });

      // Deactivate all current role permissions
      await RolePermission.update(
        { active: false },
        { where: { role_id, active: true } }
      );

      // Create role permissions for all permissions
      for (const permission of allPermissions) {
        await RolePermission.create({
          role_id,
          permission_id: permission.uuid,
          granted_by,
          granted_at: new Date(),
          active: true
        });
      }

      logger.info('Role permissions updated with wildcard access', { 
        role_id, 
        permission_count: allPermissions.length 
      });
    } else {
      // Get specific permissions by name
      const permissions = await Permission.findAll({
        where: {
          name: permission_names,
          active: true
        }
      });

      // Deactivate all current role permissions
      await RolePermission.update(
        { active: false },
        { where: { role_id, active: true } }
      );

      // Create new role permissions
      for (const permission of permissions) {
        await RolePermission.create({
          role_id,
          permission_id: permission.uuid,
          granted_by,
          granted_at: new Date(),
          active: true
        });
      }

      logger.info('Role permissions updated', { 
        role_id, 
        permission_count: permissions.length 
      });
    }
  } catch (error) {
    logger.error('Failed to update role permissions', { error, role_id });
    throw error;
  }
} 