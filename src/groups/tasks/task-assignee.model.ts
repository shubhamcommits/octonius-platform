// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../../sequelize'

// Define task assignee attributes
interface TaskAssigneeAttributes {
    uuid: string
    task_id: string
    user_id: string
    assigned_by: string
    assigned_at: Date
    created_at: Date
    updated_at: Date
}

// Define optional attributes for creation
interface TaskAssigneeCreationAttributes extends Optional<TaskAssigneeAttributes, 'uuid' | 'assigned_at' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class TaskAssignee extends Model<TaskAssigneeAttributes, TaskAssigneeCreationAttributes> implements TaskAssigneeAttributes {
    public uuid!: string
    public task_id!: string
    public user_id!: string
    public assigned_by!: string
    public assigned_at!: Date
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // TaskAssignee belongs to a task
        TaskAssignee.belongsTo(models.Task, {
            foreignKey: 'task_id',
            targetKey: 'uuid',
            as: 'task'
        })

        // TaskAssignee belongs to a user (assignee)
        TaskAssignee.belongsTo(models.User, {
            foreignKey: 'user_id',
            targetKey: 'uuid',
            as: 'assignee'
        })

        // TaskAssignee belongs to a user (assigner)
        TaskAssignee.belongsTo(models.User, {
            foreignKey: 'assigned_by',
            targetKey: 'uuid',
            as: 'assigner'
        })
    }
}

// Initialize the TaskAssignee model
TaskAssignee.init(
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
        assigned_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'uuid'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        assigned_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
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
        modelName: 'TaskAssignee',
        tableName: 'task_assignees',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['task_id', 'user_id']
            },
            {
                fields: ['task_id']
            },
            {
                fields: ['user_id']
            },
            {
                fields: ['assigned_by']
            }
        ]
    }
)

export default TaskAssignee 