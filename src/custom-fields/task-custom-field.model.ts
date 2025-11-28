// Sequelize Module
import { Model, DataTypes, Optional, Op } from 'sequelize'

// Import Database Class
import { db } from '../sequelize'

// Define task custom field attributes
interface TaskCustomFieldAttributes {
    uuid: string
    task_id: string
    field_definition_id?: string // For group-level fields
    field_name: string // For task-specific fields
    field_value: string
    field_type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean'
    is_group_field: boolean // true if from group definition, false if task-specific
    display_order: number
    created_by: string
    created_at: Date
    updated_at: Date
}

// Define task custom field creation attributes
interface TaskCustomFieldCreationAttributes
    extends Optional<TaskCustomFieldAttributes, 'uuid' | 'field_definition_id' | 'display_order' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class TaskCustomField extends Model<TaskCustomFieldAttributes, TaskCustomFieldCreationAttributes> implements TaskCustomFieldAttributes {
    public uuid!: string
    public task_id!: string
    public field_definition_id?: string
    public field_name!: string
    public field_value!: string
    public field_type!: 'text' | 'number' | 'dropdown' | 'date' | 'boolean'
    public is_group_field!: boolean
    public display_order!: number
    public created_by!: string
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // Task custom field belongs to a task
        TaskCustomField.belongsTo(models.Task, {
            foreignKey: 'task_id',
            as: 'task'
        })

        // Task custom field belongs to a group field definition (if it's a group field)
        TaskCustomField.belongsTo(models.GroupCustomFieldDefinition, {
            foreignKey: 'field_definition_id',
            as: 'fieldDefinition'
        })
    }
}

TaskCustomField.init({
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
        onDelete: 'CASCADE'
    },
    field_definition_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'group_custom_field_definitions',
            key: 'uuid'
        },
        onDelete: 'CASCADE'
    },
    field_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 100]
        }
    },
    field_value: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    field_type: {
        type: DataTypes.ENUM('text', 'number', 'dropdown', 'date', 'boolean'),
        allowNull: false,
        defaultValue: 'text'
    },
    is_group_field: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    tableName: 'task_custom_fields',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: false,
            fields: ['task_id']
        },
        {
            unique: false,
            fields: ['task_id', 'display_order']
        },
        {
            unique: false,
            fields: ['field_definition_id']
        },
        {
            unique: false,
            fields: ['is_group_field']
        },
        {
            unique: false,
            fields: ['created_by']
        },
        {
            unique: true,
            fields: ['task_id', 'field_definition_id'],
            where: {
                field_definition_id: {
                    [Op.ne]: null
                }
            }
        }
    ]
})

export default TaskCustomField
