// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../sequelize'

// Define role attributes
interface RoleAttributes {
    uuid: string
    name: string
    description: string | null
    is_system: boolean
    parent_id: string | null
    workplace_id: string | null
    active: boolean
    created_at: Date
    updated_at: Date
}

// Define role creation attributes
interface RoleCreationAttributes extends Optional<RoleAttributes, 'uuid' | 'description' | 'parent_id' | 'workplace_id' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    public uuid!: string
    public name!: string
    public description!: string | null
    public is_system!: boolean
    public parent_id!: string | null
    public workplace_id!: string | null
    public active!: boolean
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // Role belongs to parent role
        Role.belongsTo(models.Role, {
            foreignKey: 'parent_id',
            as: 'parent'
        })

        // Role has many child roles
        Role.hasMany(models.Role, {
            foreignKey: 'parent_id',
            as: 'children'
        })

        // Role belongs to workplace (if not system role)
        Role.belongsTo(models.Workplace, {
            foreignKey: 'workplace_id',
            as: 'workplace'
        })

        // Role has many users through workplace memberships
        Role.hasMany(models.WorkplaceMembership, {
            foreignKey: 'role_id',
            as: 'memberships'
        })

        // Role has many permissions through role_permissions
        Role.belongsToMany(models.Permission, {
            through: models.RolePermission,
            foreignKey: 'role_id',
            otherKey: 'permission_id',
            as: 'permission_records'
        })

        // Role has many role permissions
        Role.hasMany(models.RolePermission, {
            foreignKey: 'role_id',
            as: 'role_permissions'
        })

        // Role has many workplace invitations
        Role.hasMany(models.WorkplaceInvitation, {
            foreignKey: 'role_id',
            as: 'workplace_invitations'
        })
    }
}

Role.init({
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
            notEmpty: true,
            len: [1, 100]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_system: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'roles',
            key: 'uuid'
        }
    },
    workplace_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'workplaces',
            key: 'uuid'
        }
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize: db,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'roles',
    engine: 'InnoDB',
    indexes: [
        {
            unique: true,
            fields: ['uuid']
        },
        {
            unique: true,
            fields: ['name', 'workplace_id']
        },
        {
            fields: ['parent_id']
        },
        {
            fields: ['workplace_id']
        },
        {
            fields: ['is_system']
        },
        {
            fields: ['active']
        }
    ]
})

export default Role 