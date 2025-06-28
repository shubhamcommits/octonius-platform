// Import all models
import { User } from '../users/user.model'
import { Workplace } from '../workplaces/workplace.model'
import { WorkplaceMembership } from '../workplaces/workplace-membership.model'
import { Role } from '../roles/role.model'
import { Permission } from '../roles/permission.model'
import { RolePermission } from '../roles/role-permission.model'
import { Auth } from '../auths/auth.model'
import { Token } from '../auths/token.model'
import { LoungeStory } from '../lounge/lounge.model'
import { File } from '../files/file.model'

// Export all models
export {
    User,
    Workplace,
    WorkplaceMembership,
    Role,
    Permission,
    RolePermission,
    Auth,
    Token,
    LoungeStory,
    File
}

// Create models object
const models = {
    User,
    Workplace,
    WorkplaceMembership,
    Role,
    Permission,
    RolePermission,
    Auth,
    Token,
    LoungeStory,
    File
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