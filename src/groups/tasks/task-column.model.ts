// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../../sequelize'

// Define task column attributes
interface TaskColumnAttributes {
    uuid: string
    group_id: string
    name: string
    position: number
    color: string
    is_default: boolean
    created_by: string
    created_at: Date
    updated_at: Date
}

// Define task column creation attributes
interface TaskColumnCreationAttributes extends Optional<TaskColumnAttributes, 
    'uuid' | 'position' | 'color' | 'is_default' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class TaskColumn extends Model<TaskColumnAttributes, TaskColumnCreationAttributes> implements TaskColumnAttributes {
    public uuid!: string
    public group_id!: string
    public name!: string
    public position!: number
    public color!: string
    public is_default!: boolean
    public created_by!: string
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // Column belongs to a group
        TaskColumn.belongsTo(models.Group, {
            foreignKey: 'group_id',
            as: 'group'
        })

        // Column created by user
        TaskColumn.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        })

        // Column has many tasks
        TaskColumn.hasMany(models.Task, {
            foreignKey: 'column_id',
            as: 'tasks'
        })
    }
}

TaskColumn.init({
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    group_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'groups',
            key: 'uuid'
        }
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 100]
        }
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    color: {
        type: DataTypes.STRING(7),
        allowNull: false,
        defaultValue: '#757575',
        validate: {
            is: /^#[0-9A-F]{6}$/i
        }
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    tableName: 'task_columns',
    engine: 'InnoDB',
    indexes: [
        {
            fields: ['group_id']
        },
        {
            fields: ['position']
        }
    ]
})

export default TaskColumn 