// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../sequelize'

// Import related models for associations
import Workplace from './workplace.model'
import User from '../users/user.model'
import Role from '../roles/role.model'

// Define workplace invitation attributes
interface WorkplaceInvitationAttributes {
    uuid: string
    email: string
    workplace_id: string
    invited_by: string
    status: 'pending' | 'accepted' | 'rejected' | 'expired'
    token: string
    expires_at: Date
    accepted_at: Date | null
    rejected_at: Date | null
    user_id: string | null // Will be populated when invitation is accepted
    role_id: string
    message: string | null
    created_at: Date
    updated_at: Date
}

// Define optional attributes for creation
interface WorkplaceInvitationCreationAttributes extends Optional<WorkplaceInvitationAttributes, 
    'uuid' | 'status' | 'accepted_at' | 'rejected_at' | 'user_id' | 'message' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class WorkplaceInvitation extends Model<WorkplaceInvitationAttributes, WorkplaceInvitationCreationAttributes> implements WorkplaceInvitationAttributes {
    public uuid!: string
    public email!: string
    public workplace_id!: string
    public invited_by!: string
    public status!: 'pending' | 'accepted' | 'rejected' | 'expired'
    public token!: string
    public expires_at!: Date
    public accepted_at!: Date | null
    public rejected_at!: Date | null
    public user_id!: string | null
    public role_id!: string
    public message!: string | null
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // Invitation belongs to a workplace
        WorkplaceInvitation.belongsTo(models.Workplace, {
            foreignKey: 'workplace_id',
            as: 'workplace'
        })
        
        // Invitation belongs to an inviter (user)
        WorkplaceInvitation.belongsTo(models.User, {
            foreignKey: 'invited_by',
            as: 'inviter'
        })
        
        // Invitation belongs to a user (when accepted)
        WorkplaceInvitation.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        })
        
        // Invitation belongs to a role
        WorkplaceInvitation.belongsTo(models.Role, {
            foreignKey: 'role_id',
            as: 'role'
        })
    }
}

WorkplaceInvitation.init({
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            isEmail: true
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
    invited_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'uuid'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired'),
        allowNull: false,
        defaultValue: 'pending'
    },
    token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    accepted_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rejected_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
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
    message: {
        type: DataTypes.TEXT,
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
    tableName: 'workplace_invitations',
    engine: 'InnoDB',
    indexes: [
        {
            unique: true,
            fields: ['uuid']
        },
        {
            unique: true,
            fields: ['token']
        },
        {
            fields: ['email']
        },
        {
            fields: ['workplace_id']
        },
        {
            fields: ['invited_by']
        },
        {
            fields: ['status']
        },
        {
            fields: ['expires_at']
        }
    ]
})

export default WorkplaceInvitation 