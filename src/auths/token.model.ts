// Sequelize Module
import { Model, DataTypes } from 'sequelize'
import { db } from '../sequelize'
import { User } from '../users/user.model'

export class Token extends Model {
    public uuid!: string
    public user_id!: string
    public access_token!: string
    public refresh_token!: string
    public access_expires_at!: Date
    public refresh_expires_at!: Date
    public created_at!: Date
    public updated_at!: Date

    public static associate() {
        Token.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
    }
}

Token.init({
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    access_token: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    refresh_token: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    access_expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    refresh_expires_at: {
        type: DataTypes.DATE,
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
    engine: 'InnoDB',
    tableName: 'tokens',
    indexes: []
})

export default Token 