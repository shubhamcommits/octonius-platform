// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../sequelize'

// Define group attributes
interface GroupAttributes {
    uuid: string
    name: string
    description: string | null
    image_url: string | null
    workplace_id: string
    created_by: string
    is_active: boolean
    settings: {
        allow_member_invites: boolean
        require_approval: boolean
        visibility: 'public' | 'private'
        default_role: 'member' | 'admin'
    }
    metadata: {
        tags: string[]
        category: string | null
        department: string | null
    }
    created_at: Date
    updated_at: Date
}

// Define group creation attributes
interface GroupCreationAttributes extends Optional<GroupAttributes, 'uuid' | 'description' | 'image_url' | 'is_active' | 'settings' | 'metadata' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class Group extends Model<GroupAttributes, GroupCreationAttributes> implements GroupAttributes {
    public uuid!: string
    public name!: string
    public description!: string | null
    public image_url!: string | null
    public workplace_id!: string
    public created_by!: string
    public is_active!: boolean
    public settings!: {
        allow_member_invites: boolean
        require_approval: boolean
        visibility: 'public' | 'private'
        default_role: 'member' | 'admin'
    }
    public metadata!: {
        tags: string[]
        category: string | null
        department: string | null
    }
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // Group belongs to a workplace
        Group.belongsTo(models.Workplace, {
            foreignKey: 'workplace_id',
            targetKey: 'uuid',
            as: 'workplace'
        })

        // Group belongs to a creator (user)
        Group.belongsTo(models.User, {
            foreignKey: 'created_by',
            targetKey: 'uuid',
            as: 'creator'
        })

        // Group has many members through group memberships
        Group.belongsToMany(models.User, {
            through: models.GroupMembership,
            foreignKey: 'group_id',
            otherKey: 'user_id',
            as: 'members'
        })

        // Group has many group memberships
        Group.hasMany(models.GroupMembership, {
            foreignKey: 'group_id',
            sourceKey: 'uuid',
            as: 'group_memberships'
        })
    }
}

Group.init({
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [1, 100],
            notEmpty: true
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 1000]
        }
    },
    image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    workplace_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'workplaces',
            key: 'uuid'
        },
        validate: {
            notEmpty: true
        }
    },
    created_by: {
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
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    settings: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
            allow_member_invites: true,
            require_approval: false,
            visibility: 'public',
            default_role: 'member'
        }
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
            tags: [],
            category: null,
            department: null
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
    tableName: 'groups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['name', 'workplace_id']
        },
        {
            fields: ['workplace_id']
        },
        {
            fields: ['created_by']
        },
        {
            fields: ['is_active']
        }
    ]
})

export default Group 