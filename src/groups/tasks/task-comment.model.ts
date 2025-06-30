// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../../sequelize'

// Define task comment attributes
interface TaskCommentAttributes {
    uuid: string
    task_id: string
    user_id: string
    content: string
    created_at: Date
    updated_at: Date
}

// Define optional attributes for creation
interface TaskCommentCreationAttributes extends Optional<TaskCommentAttributes, 'uuid' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class TaskComment extends Model<TaskCommentAttributes, TaskCommentCreationAttributes> implements TaskCommentAttributes {
    public uuid!: string
    public task_id!: string
    public user_id!: string
    public content!: string
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // TaskComment belongs to a task
        TaskComment.belongsTo(models.Task, {
            foreignKey: 'task_id',
            targetKey: 'uuid',
            as: 'task'
        })

        // TaskComment belongs to a user
        TaskComment.belongsTo(models.User, {
            foreignKey: 'user_id',
            targetKey: 'uuid',
            as: 'user'
        })
    }
}

// Initialize the TaskComment model
TaskComment.init(
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        task_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'tasks',
                key: 'uuid'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'uuid'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 5000] // Max 5000 characters
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
    },
    {
        sequelize: db,
        modelName: 'TaskComment',
        tableName: 'task_comments',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['task_id']
            },
            {
                fields: ['user_id']
            },
            {
                fields: ['created_at']
            }
        ]
    }
)

export default TaskComment 