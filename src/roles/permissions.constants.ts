// Permission Categories
export const PERMISSION_CATEGORIES = {
  WORKPLACE: 'workplace',
  USER: 'user',
  ROLE: 'role',
  GROUP: 'group',
  TASK: 'task',
  FILE: 'file',
  INVITATION: 'invitation',
  SETTINGS: 'settings'
} as const;

// Permission Actions
export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage', // Full access
  INVITE: 'invite',
  ASSIGN: 'assign'
} as const;

// Define all system permissions
export const SYSTEM_PERMISSIONS = {
  // Workplace permissions
  WORKPLACE_VIEW: {
    name: 'workplace.view',
    description: 'View workplace information',
    category: PERMISSION_CATEGORIES.WORKPLACE,
    module: 'workplace',
    action: PERMISSION_ACTIONS.READ
  },
  WORKPLACE_UPDATE: {
    name: 'workplace.update',
    description: 'Update workplace settings',
    category: PERMISSION_CATEGORIES.WORKPLACE,
    module: 'workplace',
    action: PERMISSION_ACTIONS.UPDATE
  },
  WORKPLACE_DELETE: {
    name: 'workplace.delete',
    description: 'Delete workplace',
    category: PERMISSION_CATEGORIES.WORKPLACE,
    module: 'workplace',
    action: PERMISSION_ACTIONS.DELETE
  },
  WORKPLACE_MANAGE: {
    name: 'workplace.manage',
    description: 'Full workplace management',
    category: PERMISSION_CATEGORIES.WORKPLACE,
    module: 'workplace',
    action: PERMISSION_ACTIONS.MANAGE
  },

  // User permissions
  USER_VIEW: {
    name: 'user.view',
    description: 'View user profiles',
    category: PERMISSION_CATEGORIES.USER,
    module: 'user',
    action: PERMISSION_ACTIONS.READ
  },
  USER_INVITE: {
    name: 'user.invite',
    description: 'Invite new users',
    category: PERMISSION_CATEGORIES.USER,
    module: 'user',
    action: PERMISSION_ACTIONS.INVITE
  },
  USER_UPDATE: {
    name: 'user.update',
    description: 'Update user information',
    category: PERMISSION_CATEGORIES.USER,
    module: 'user',
    action: PERMISSION_ACTIONS.UPDATE
  },
  USER_DELETE: {
    name: 'user.delete',
    description: 'Remove users from workplace',
    category: PERMISSION_CATEGORIES.USER,
    module: 'user',
    action: PERMISSION_ACTIONS.DELETE
  },
  USER_MANAGE: {
    name: 'user.manage',
    description: 'Full user management',
    category: PERMISSION_CATEGORIES.USER,
    module: 'user',
    action: PERMISSION_ACTIONS.MANAGE
  },

  // Role permissions
  ROLE_VIEW: {
    name: 'role.view',
    description: 'View roles and permissions',
    category: PERMISSION_CATEGORIES.ROLE,
    module: 'role',
    action: PERMISSION_ACTIONS.READ
  },
  ROLE_CREATE: {
    name: 'role.create',
    description: 'Create new roles',
    category: PERMISSION_CATEGORIES.ROLE,
    module: 'role',
    action: PERMISSION_ACTIONS.CREATE
  },
  ROLE_UPDATE: {
    name: 'role.update',
    description: 'Update roles and permissions',
    category: PERMISSION_CATEGORIES.ROLE,
    module: 'role',
    action: PERMISSION_ACTIONS.UPDATE
  },
  ROLE_DELETE: {
    name: 'role.delete',
    description: 'Delete roles',
    category: PERMISSION_CATEGORIES.ROLE,
    module: 'role',
    action: PERMISSION_ACTIONS.DELETE
  },
  ROLE_ASSIGN: {
    name: 'role.assign',
    description: 'Assign roles to users',
    category: PERMISSION_CATEGORIES.ROLE,
    module: 'role',
    action: PERMISSION_ACTIONS.ASSIGN
  },
  ROLE_MANAGE: {
    name: 'role.manage',
    description: 'Full role management',
    category: PERMISSION_CATEGORIES.ROLE,
    module: 'role',
    action: PERMISSION_ACTIONS.MANAGE
  },

  // Group permissions
  GROUP_VIEW: {
    name: 'group.view',
    description: 'View groups',
    category: PERMISSION_CATEGORIES.GROUP,
    module: 'group',
    action: PERMISSION_ACTIONS.READ
  },
  GROUP_CREATE: {
    name: 'group.create',
    description: 'Create new groups',
    category: PERMISSION_CATEGORIES.GROUP,
    module: 'group',
    action: PERMISSION_ACTIONS.CREATE
  },
  GROUP_UPDATE: {
    name: 'group.update',
    description: 'Update group information',
    category: PERMISSION_CATEGORIES.GROUP,
    module: 'group',
    action: PERMISSION_ACTIONS.UPDATE
  },
  GROUP_DELETE: {
    name: 'group.delete',
    description: 'Delete groups',
    category: PERMISSION_CATEGORIES.GROUP,
    module: 'group',
    action: PERMISSION_ACTIONS.DELETE
  },
  GROUP_MANAGE: {
    name: 'group.manage',
    description: 'Full group management',
    category: PERMISSION_CATEGORIES.GROUP,
    module: 'group',
    action: PERMISSION_ACTIONS.MANAGE
  },

  // Task permissions
  TASK_VIEW: {
    name: 'task.view',
    description: 'View tasks',
    category: PERMISSION_CATEGORIES.TASK,
    module: 'task',
    action: PERMISSION_ACTIONS.READ
  },
  TASK_CREATE: {
    name: 'task.create',
    description: 'Create new tasks',
    category: PERMISSION_CATEGORIES.TASK,
    module: 'task',
    action: PERMISSION_ACTIONS.CREATE
  },
  TASK_UPDATE: {
    name: 'task.update',
    description: 'Update tasks',
    category: PERMISSION_CATEGORIES.TASK,
    module: 'task',
    action: PERMISSION_ACTIONS.UPDATE
  },
  TASK_DELETE: {
    name: 'task.delete',
    description: 'Delete tasks',
    category: PERMISSION_CATEGORIES.TASK,
    module: 'task',
    action: PERMISSION_ACTIONS.DELETE
  },
  TASK_ASSIGN: {
    name: 'task.assign',
    description: 'Assign tasks to users',
    category: PERMISSION_CATEGORIES.TASK,
    module: 'task',
    action: PERMISSION_ACTIONS.ASSIGN
  },
  TASK_MANAGE: {
    name: 'task.manage',
    description: 'Full task management',
    category: PERMISSION_CATEGORIES.TASK,
    module: 'task',
    action: PERMISSION_ACTIONS.MANAGE
  },

  // File permissions
  FILE_VIEW: {
    name: 'file.view',
    description: 'View files',
    category: PERMISSION_CATEGORIES.FILE,
    module: 'file',
    action: PERMISSION_ACTIONS.READ
  },
  FILE_CREATE: {
    name: 'file.create',
    description: 'Upload and create files',
    category: PERMISSION_CATEGORIES.FILE,
    module: 'file',
    action: PERMISSION_ACTIONS.CREATE
  },
  FILE_UPDATE: {
    name: 'file.update',
    description: 'Update files',
    category: PERMISSION_CATEGORIES.FILE,
    module: 'file',
    action: PERMISSION_ACTIONS.UPDATE
  },
  FILE_DELETE: {
    name: 'file.delete',
    description: 'Delete files',
    category: PERMISSION_CATEGORIES.FILE,
    module: 'file',
    action: PERMISSION_ACTIONS.DELETE
  },
  FILE_MANAGE: {
    name: 'file.manage',
    description: 'Full file management',
    category: PERMISSION_CATEGORIES.FILE,
    module: 'file',
    action: PERMISSION_ACTIONS.MANAGE
  }
};

// Default role definitions
export const DEFAULT_ROLES = {
  OWNER: {
    name: 'owner',
    description: 'Owner of the workplace with full access',
    permissions: getOwnerPermissions(),
    is_system: true
  },
  ADMIN: {
    name: 'admin',
    description: 'Administrator with management access',
    permissions: getAdminPermissions(),
    is_system: true
  },
  MEMBER: {
    name: 'member',
    description: 'Regular member with basic access',
    permissions: getMemberPermissions(),
    is_system: true
  }
};

// Helper function to get all permission names
export function getAllPermissionNames(): string[] {
  return Object.values(SYSTEM_PERMISSIONS).map(p => p.name);
}

// Helper function to check if a role has a specific permission
export function roleHasPermission(rolePermissions: string[], permission: string): boolean {
  // Check for wildcard permission (full access)
  if (rolePermissions.includes('*')) {
    return true;
  }
  
  // Check for specific permission
  return rolePermissions.includes(permission);
}

// Helper function to get permissions by category
export function getPermissionsByCategory(category: string) {
  return Object.values(SYSTEM_PERMISSIONS).filter(p => p.category === category);
}

// Helper function to validate permission name
export function isValidPermission(permissionName: string): boolean {
  return Object.values(SYSTEM_PERMISSIONS).some(p => p.name === permissionName);
} 

// Helper function to get admin permissions
export function getAdminPermissions(): string[] {
  return [
    // Workplace permissions
    SYSTEM_PERMISSIONS.WORKPLACE_VIEW.name,
    SYSTEM_PERMISSIONS.WORKPLACE_UPDATE.name,
    
    // User permissions
    SYSTEM_PERMISSIONS.USER_VIEW.name,
    SYSTEM_PERMISSIONS.USER_INVITE.name,
    SYSTEM_PERMISSIONS.USER_UPDATE.name,
    SYSTEM_PERMISSIONS.USER_DELETE.name,
    
    // Role permissions
    SYSTEM_PERMISSIONS.ROLE_VIEW.name,
    SYSTEM_PERMISSIONS.ROLE_ASSIGN.name,
    
    // Group permissions
    SYSTEM_PERMISSIONS.GROUP_MANAGE.name,
    
    // Task permissions
    SYSTEM_PERMISSIONS.TASK_MANAGE.name,
    
    // File permissions
    SYSTEM_PERMISSIONS.FILE_MANAGE.name
  ];
}

// Helper function to get owner permissions (all permissions)
export function getOwnerPermissions(): string[] {
  return Object.values(SYSTEM_PERMISSIONS).map(p => p.name);
}

// Helper function to get member permissions
export function getMemberPermissions(): string[] {
  return [
    // Basic workplace access
    SYSTEM_PERMISSIONS.WORKPLACE_VIEW.name,
    
    // User permissions (view only)
    SYSTEM_PERMISSIONS.USER_VIEW.name,
    
    // Group permissions (view and create)
    SYSTEM_PERMISSIONS.GROUP_VIEW.name,
    SYSTEM_PERMISSIONS.GROUP_CREATE.name,
    
    // Task permissions (view, create, update)
    SYSTEM_PERMISSIONS.TASK_VIEW.name,
    SYSTEM_PERMISSIONS.TASK_CREATE.name,
    SYSTEM_PERMISSIONS.TASK_UPDATE.name,
    
    // File permissions (view, create, update)
    SYSTEM_PERMISSIONS.FILE_VIEW.name,
    SYSTEM_PERMISSIONS.FILE_CREATE.name,
    SYSTEM_PERMISSIONS.FILE_UPDATE.name
  ];
}