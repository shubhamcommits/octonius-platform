// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../../sequelize'

// Define task attributes
interface TaskAttributes {
    uuid: string
    group_id: string
    column_id: string
    title: string
    description: string | null
    status: 'todo' | 'in_progress' | 'review' | 'done'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    color: string
    position: number
    due_date: Date | null
    start_date: Date | null
    completed_at: Date | null
    completed_by: string | null
    created_by: string
    assigned_to: string | null
    labels: Array<{
        text: string
        color: string
    }>
    attachments: Array<{
        url: string
        name: string
        size: number
        type: string
    }>
    metadata: {
        estimated_hours?: number
        actual_hours?: number
        custom_fields?: Record<string, any>
    }
    created_at: Date
    updated_at: Date
}

// Define task creation attributes
interface TaskCreationAttributes extends Optional<TaskAttributes, 
    'uuid' | 'description' | 'status' | 'priority' | 'color' | 'position' | 
    'due_date' | 'start_date' | 'completed_at' | 'completed_by' | 'assigned_to' | 
    'labels' | 'attachments' | 'metadata' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
    public uuid!: string
    public group_id!: string
    public column_id!: string
    public title!: string
    public description!: string | null
    public status!: 'todo' | 'in_progress' | 'review' | 'done'
    public priority!: 'low' | 'medium' | 'high' | 'urgent'
    public color!: string
    public position!: number
    public due_date!: Date | null
    public start_date!: Date | null
    public completed_at!: Date | null
    public completed_by!: string | null
    public created_by!: string
    public assigned_to!: string | null
    public labels!: Array<{
        text: string
        color: string
    }>
    public attachments!: Array<{
        url: string
        name: string
        size: number
        type: string
    }>
    public metadata!: {
        estimated_hours?: number
        actual_hours?: number
        custom_fields?: Record<string, any>
    }
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // Task belongs to a group
        Task.belongsTo(models.Group, {
            foreignKey: 'group_id',
            as: 'group'
        })

        // Task belongs to a column
        Task.belongsTo(models.TaskColumn, {
            foreignKey: 'column_id',
            as: 'column'
        })

        // Task created by user
        Task.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        })

        // Task assigned to user
        Task.belongsTo(models.User, {
            foreignKey: 'assigned_to',
            as: 'assignee'
        })

        // Task completed by user
        Task.belongsTo(models.User, {
            foreignKey: 'completed_by',
            as: 'completer'
        })
    }
}

Task.init({
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
    column_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'task_columns',
            key: 'uuid'
        }
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done'),
        allowNull: false,
        defaultValue: 'todo'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium'
    },
    color: {
        type: DataTypes.STRING(7),
        allowNull: false,
        defaultValue: '#757575',
        validate: {
            is: /^#[0-9A-F]{6}$/i
        }
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'uuid'
        }
    },
    created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'uuid'
        }
    },
    assigned_to: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'uuid'
        }
    },
    labels: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    attachments: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
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
    tableName: 'tasks',
    engine: 'InnoDB',
    indexes: [
        {
            fields: ['group_id']
        },
        {
            fields: ['column_id']
        },
        {
            fields: ['assigned_to']
        },
        {
            fields: ['status']
        },
        {
            fields: ['priority']
        },
        {
            fields: ['due_date']
        },
        {
            fields: ['position']
        }
    ]
})

export default Task 