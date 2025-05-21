// Sequelize Module
import { Model, DataTypes } from 'sequelize'

// Import Database Class
import { db } from '../sequelize'

// Import User model for association
import { User } from '../users/user.model'

/**
 * Sequelize Model for Auth (session/token management)
 */
export class Auth extends Model {
    public uuid!: string
    public token!: string
    public refresh_token!: string
    public user_id!: string
    public last_login!: Date
    public last_logout!: Date | null
    public created_date!: Date
    public logged_in!: boolean
    public ip_address!: string | null

    // Association: Auth belongs to User
    public static associate() {
        Auth.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
    }
}

Auth.init({
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    token: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    refresh_token: {
        type: DataTypes.TEXT,
        defaultValue: '',
        allowNull: false
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    last_logout: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    logged_in: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    }
}, {
    sequelize: db,
    engine: 'InnoDB',
    tableName: 'auths',
    indexes: []
})

export default Auth 