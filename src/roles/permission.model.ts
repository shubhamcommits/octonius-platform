// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../sequelize'

// Define permission attributes
interface PermissionAttributes {
    uuid: string
    name: string
    description: string | null
    category: string
    module: string
    action: string
    is_system: boolean
    active: boolean
    created_at: Date
    updated_at: Date
}

// Define permission creation attributes
interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'uuid' | 'description' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
    public uuid!: string
    public name!: string
    public description!: string | null
    public category!: string
    public module!: string
    public action!: string
    public is_system!: boolean
    public active!: boolean
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // Permission belongs to many roles through role_permissions
        Permission.belongsToMany(models.Role, {
            through: models.RolePermission,
            foreignKey: 'permission_id',
            otherKey: 'role_id',
            as: 'roles'
        })

        // Permission has many role permissions
        Permission.hasMany(models.RolePermission, {
            foreignKey: 'permission_id',
            as: 'role_permissions'
        })
    }
}

Permission.init({
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
    category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 50]
        }
    },
    module: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 50]
        }
    },
    action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 50]
        }
    },
    is_system: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    tableName: 'permissions',
    engine: 'InnoDB',
    indexes: [
        {
            unique: true,
            fields: ['uuid']
        },
        {
            unique: true,
            fields: ['module', 'action']
        },
        {
            fields: ['category']
        },
        {
            fields: ['is_system']
        },
        {
            fields: ['active']
        }
    ]
})

export default Permission 