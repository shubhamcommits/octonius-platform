// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../sequelize'

// Define role permission attributes
interface RolePermissionAttributes {
    uuid: string
    role_id: string
    permission_id: string
    granted_by: string
    granted_at: Date
    expires_at: Date | null
    active: boolean
    created_at: Date
    updated_at: Date
}

// Define role permission creation attributes
interface RolePermissionCreationAttributes extends Optional<RolePermissionAttributes, 'uuid' | 'expires_at' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
    public uuid!: string
    public role_id!: string
    public permission_id!: string
    public granted_by!: string
    public granted_at!: Date
    public expires_at!: Date | null
    public active!: boolean
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // Belongs to Role
        RolePermission.belongsTo(models.Role, {
            foreignKey: 'role_id',
            as: 'role'
        })

        // Belongs to Permission
        RolePermission.belongsTo(models.Permission, {
            foreignKey: 'permission_id',
            as: 'permission'
        })

        // Belongs to User (who granted the permission)
        RolePermission.belongsTo(models.User, {
            foreignKey: 'granted_by',
            as: 'granter'
        })
    }
}

RolePermission.init({
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'uuid'
        }
    },
    permission_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'permissions',
            key: 'uuid'
        }
    },
    granted_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'uuid'
        }
    },
    granted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
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
    tableName: 'role_permissions',
    engine: 'InnoDB',
    indexes: [
        {
            unique: true,
            fields: ['uuid']
        },
        {
            unique: true,
            fields: ['role_id', 'permission_id']
        },
        {
            fields: ['granted_by']
        },
        {
            fields: ['expires_at']
        },
        {
            fields: ['active']
        }
    ]
})

export default RolePermission 