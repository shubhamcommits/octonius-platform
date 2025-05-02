// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../sequelize'

// Define workplace attributes
interface WorkplaceAttributes {
    uuid: string
    name: string
    description: string | null
    logo_url: string | null
    website: string | null
    industry: string | null
    size: string | null
    timezone: string
    active: boolean
    created_by: string
    created_at: Date
    updated_at: Date
}

// Define workplace creation attributes
interface WorkplaceCreationAttributes extends Optional<WorkplaceAttributes, 'uuid' | 'description' | 'logo_url' | 'website' | 'industry' | 'size' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class Workplace extends Model<WorkplaceAttributes, WorkplaceCreationAttributes> implements WorkplaceAttributes {
    public uuid!: string
    public name!: string
    public description!: string | null
    public logo_url!: string | null
    public website!: string | null
    public industry!: string | null
    public size!: string | null
    public timezone!: string
    public active!: boolean
    public created_by!: string
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // Workplace has many users (members)
        Workplace.hasMany(models.User, {
            foreignKey: 'workplace_id',
            as: 'members'
        })

        // Workplace has many roles
        Workplace.hasMany(models.Role, {
            foreignKey: 'workplace_id',
            as: 'roles'
        })
    }
}

Workplace.init({
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
    logo_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    industry: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    size: {
        type: DataTypes.ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
        allowNull: true
    },
    timezone: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'UTC'
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'uuid'
        }
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
    tableName: 'workplaces',
    engine: 'InnoDB',
    indexes: [
        {
            unique: true,
            fields: ['uuid']
        },
        {
            unique: true,
            fields: ['name']
        },
        {
            fields: ['created_by']
        },
        {
            fields: ['active']
        }
    ]
})

export default Workplace 