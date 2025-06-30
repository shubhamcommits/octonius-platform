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
import { Group } from '../groups/group.model'
import { GroupMembership } from '../groups/group-membership.model'
import { GroupActivityPost } from '../groups/activity/activity.model'
import { GroupActivityLike } from '../groups/activity/activity.model'
import { GroupActivityComment } from '../groups/activity/activity.model'
import { Task } from '../groups/tasks/task.model'
import { TaskColumn } from '../groups/tasks/task-column.model'
import { TaskComment } from '../groups/tasks/task-comment.model'
import { TaskAssignee } from '../groups/tasks/task-assignee.model'

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
    File,
    Group,
    GroupMembership,
    GroupActivityPost,
    GroupActivityLike,
    GroupActivityComment,
    Task,
    TaskColumn,
    TaskComment,
    TaskAssignee
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
    File,
    Group,
    GroupMembership,
    GroupActivityPost,
    GroupActivityLike,
    GroupActivityComment,
    Task,
    TaskColumn,
    TaskComment,
    TaskAssignee
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