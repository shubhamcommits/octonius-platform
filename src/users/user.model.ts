// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../sequelize'

// Import Constants
import { DEFAULT_AVATAR_URL } from '../config/constants'

// Define user attributes (passwordless authentication)
interface UserAttributes {
    uuid: string
    active: boolean
    first_name: string | null
    last_name: string | null
    email: string
    phone: string | null
    avatar_url: string | null
    job_title: string | null
    department: string | null
    timezone: string
    language: string
    notification_preferences: {
        email: boolean
        push: boolean
        in_app: boolean
    }
    disabled_at: Date | null
    source: string
    role: string | null
    created_at: Date
    updated_at: Date
    current_workplace_id: string | null
}

// Define user creation attributes
interface UserCreationAttributes extends Optional<UserAttributes, 'uuid' | 'first_name' | 'last_name' | 'avatar_url' | 'job_title' | 'department' | 'disabled_at' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public uuid!: string
    public active!: boolean
    public first_name!: string | null
    public last_name!: string | null
    public email!: string
    public phone: string | null
    public avatar_url!: string | null
    public job_title!: string | null
    public department!: string | null
    public timezone!: string
    public language!: string
    public notification_preferences!: {
        email: boolean
        push: boolean
        in_app: boolean
    }
    public disabled_at!: Date | null
    public source!: string
    public role!: string | null
    public readonly created_at!: Date
    public readonly updated_at!: Date
    public current_workplace_id!: string | null

    // Define associations
    static associate(models: any) {
        // User belongs to many workplaces through memberships
        User.belongsToMany(models.Workplace, {
            through: models.WorkplaceMembership,
            foreignKey: 'user_id',
            otherKey: 'workplace_id',
            as: 'workplaces'
        })

        // User has many workplace memberships
        User.hasMany(models.WorkplaceMembership, {
            foreignKey: 'user_id',
            as: 'workplace_memberships'
        })

        // User has many lounge stories as author
        User.hasMany(models.LoungeStory, {
            foreignKey: 'user_id',
            sourceKey: 'uuid',
            as: 'lounge_stories'
        })

        // User has many task comments
        User.hasMany(models.TaskComment, {
            foreignKey: 'user_id',
            sourceKey: 'uuid',
            as: 'task_comments'
        })
    }

    // Virtual getter for avatar URL with fallback
    get avatarUrlWithFallback(): string {
        return this.avatar_url || DEFAULT_AVATAR_URL
    }

    // Method to get user display data with fallbacks
    getUserDisplay() {
        return {
            uuid: this.uuid,
            first_name: this.first_name,
            last_name: this.last_name,
            email: this.email,
            avatar_url: this.avatarUrlWithFallback,
            display_name: this.first_name || this.last_name 
                ? `${this.first_name || ''} ${this.last_name || ''}`.trim()
                : this.email,
            initials: this.first_name || this.last_name
                ? `${this.first_name?.charAt(0) || ''}${this.last_name?.charAt(0) || ''}`
                : this.email.charAt(0).toUpperCase()
        }
    }
}

User.init({
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    first_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            len: [0, 50]
        }
    },
    last_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            len: [0, 50]
        }
    },
    email: {
        type: DataTypes.STRING(100),
        unique: 'email',
        allowNull: false,
        validate: {
            isEmail: {
                msg: "Please provide a valid email address!"
            },
            len: [1, 100]
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        unique: 'phone',
        allowNull: true,
        validate: {
            is: {
                args: /^[0-9]+$/,
                msg: "Please provide a valid phone number!"
            },
            len: [1, 20]
        }
    },
    avatar_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    job_title: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    department: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    timezone: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'UTC'
    },
    language: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'en',
        validate: {
            len: [2, 10]
        }
    },
    notification_preferences: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
            email: true,
            push: true,
            in_app: true
        }
    },
    disabled_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    source: {
        type: DataTypes.STRING(50),
        defaultValue: 'email',
        allowNull: false,
        validate: {
            len: [1, 50]
        }
    },
    role: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'roles',
            key: 'uuid'
        }
    },
    current_workplace_id: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null
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
    tableName: 'users',
    engine: 'InnoDB',
    indexes: [
        {
            unique: true,
            fields: ['uuid']
        },
        {
            unique: true,
            fields: ['email']
        },
        {
            unique: true,
            fields: ['phone']
        },
        {
            fields: ['role']
        },
        {
            fields: ['active']
        },
        {
            fields: ['department']
        }
    ]
})

export default User