// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../sequelize'

// Define workplace membership attributes
interface WorkplaceMembershipAttributes {
    uuid: string
    user_id: string
    workplace_id: string
    role_id: string
    status: 'active' | 'pending' | 'inactive'
    joined_at: Date
    last_active_at: Date | null
    created_at: Date
    updated_at: Date
}

// Define workplace membership creation attributes
interface WorkplaceMembershipCreationAttributes extends Optional<WorkplaceMembershipAttributes, 'uuid' | 'last_active_at' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class WorkplaceMembership extends Model<WorkplaceMembershipAttributes, WorkplaceMembershipCreationAttributes> implements WorkplaceMembershipAttributes {
    public uuid!: string
    public user_id!: string
    public workplace_id!: string
    public role_id!: string
    public status!: 'active' | 'pending' | 'inactive'
    public joined_at!: Date
    public last_active_at!: Date | null
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // Belongs to User
        WorkplaceMembership.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        })
        
        // Belongs to Workplace
        WorkplaceMembership.belongsTo(models.Workplace, {
            foreignKey: 'workplace_id',
            as: 'workplace'
        })

        // Belongs to Role
        WorkplaceMembership.belongsTo(models.Role, {
            foreignKey: 'role_id',
            as: 'role'
        })
    }
}

WorkplaceMembership.init({
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'uuid'
        }
    },
    workplace_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'workplaces',
            key: 'uuid'
        }
    },
    role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'uuid'
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'pending', 'inactive'),
        allowNull: false,
        defaultValue: 'pending'
    },
    joined_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    last_active_at: {
        type: DataTypes.DATE,
        allowNull: true
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
    tableName: 'workplace_memberships',
    engine: 'InnoDB',
    indexes: [
        {
            unique: true,
            fields: ['uuid']
        },
        {
            unique: true,
            fields: ['user_id', 'workplace_id']
        },
        {
            fields: ['role_id']
        },
        {
            fields: ['status']
        }
    ]
})

export default WorkplaceMembership 