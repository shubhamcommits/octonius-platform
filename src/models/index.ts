// Import all models
import { User } from '../users/user.model'
import { Workplace } from '../workplaces/workplace.model'
import { WorkplaceMembership } from '../workplaces/workplace-membership.model'
import { Role } from '../roles/role.model'
import { Permission } from '../roles/permission.model'
import { RolePermission } from '../roles/role-permission.model'
import { Auth } from '../auths/auth.model'

// Export all models
export {
    User,
    Workplace,
    WorkplaceMembership,
    Role,
    Permission,
    RolePermission,
    Auth
}

// Create models object
const models = {
    User,
    Workplace,
    WorkplaceMembership,
    Role,
    Permission,
    RolePermission,
    Auth
}

// Initialize associations
export function initializeAssociations() {
    // Call associate method on each model that has it
    Object.values(models).forEach((model: any) => {
        if (model.associate) {
            model.associate(models)
        }
    })
}

// Export models object
export default models 