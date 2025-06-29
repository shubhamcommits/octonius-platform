// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../sequelize'

// Define group membership attributes
interface GroupMembershipAttributes {
    uuid: string
    group_id: string
    user_id: string
    role: 'admin' | 'member' | 'viewer'
    joined_at: Date
    invited_by: string | null
    status: 'active' | 'pending' | 'inactive'
    permissions: {
        can_edit_group: boolean
        can_add_members: boolean
        can_remove_members: boolean
        can_create_tasks: boolean
        can_assign_tasks: boolean
        can_view_analytics: boolean
    }
    created_at: Date
    updated_at: Date
}

// Define group membership creation attributes
interface GroupMembershipCreationAttributes extends Optional<GroupMembershipAttributes, 'uuid' | 'role' | 'joined_at' | 'invited_by' | 'status' | 'permissions' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class GroupMembership extends Model<GroupMembershipAttributes, GroupMembershipCreationAttributes> implements GroupMembershipAttributes {
    public uuid!: string
    public group_id!: string
    public user_id!: string
    public role!: 'admin' | 'member' | 'viewer'
    public joined_at!: Date
    public invited_by!: string | null
    public status!: 'active' | 'pending' | 'inactive'
    public permissions!: {
        can_edit_group: boolean
        can_add_members: boolean
        can_remove_members: boolean
        can_create_tasks: boolean
        can_assign_tasks: boolean
        can_view_analytics: boolean
    }
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // GroupMembership belongs to a group
        GroupMembership.belongsTo(models.Group, {
            foreignKey: 'group_id',
            targetKey: 'uuid',
            as: 'group'
        })

        // GroupMembership belongs to a user
        GroupMembership.belongsTo(models.User, {
            foreignKey: 'user_id',
            targetKey: 'uuid',
            as: 'user'
        })

        // GroupMembership belongs to an inviter (user)
        GroupMembership.belongsTo(models.User, {
            foreignKey: 'invited_by',
            targetKey: 'uuid',
            as: 'inviter'
        })
    }
}

GroupMembership.init({
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    group_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'groups',
            key: 'uuid'
        },
        validate: {
            notEmpty: true
        }
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'uuid'
        },
        validate: {
            notEmpty: true
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'member', 'viewer'),
        defaultValue: 'member',
        allowNull: false
    },
    joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    invited_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'uuid'
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'pending', 'inactive'),
        defaultValue: 'active',
        allowNull: false
    },
    permissions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
            can_edit_group: false,
            can_add_members: false,
            can_remove_members: false,
            can_create_tasks: true,
            can_assign_tasks: false,
            can_view_analytics: false
        }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }
}, {
    sequelize: db,
    tableName: 'group_memberships',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['group_id', 'user_id']
        },
        {
            fields: ['group_id']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['role']
        }
    ]
})

export default GroupMembership 