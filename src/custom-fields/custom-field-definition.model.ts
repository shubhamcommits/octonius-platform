// Sequelize Module
import { Model, DataTypes, Optional } from 'sequelize'

// Import Database Class
import { db } from '../sequelize'

// Define group custom field definition attributes
interface GroupCustomFieldDefinitionAttributes {
    uuid: string
    group_id: string
    name: string
    type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean'
    required: boolean
    placeholder?: string
    description?: string
    options?: string[] // For dropdown fields
    validation_rules?: {
        min_length?: number
        max_length?: number
        min_value?: number
        max_value?: number
        pattern?: string
    }
    display_order: number
    is_active: boolean
    created_by: string
    created_at: Date
    updated_at: Date
}

// Define group custom field definition creation attributes
interface GroupCustomFieldDefinitionCreationAttributes
    extends Optional<GroupCustomFieldDefinitionAttributes, 'uuid' | 'placeholder' | 'description' | 'options' | 'validation_rules' | 'display_order' | 'is_active' | 'created_at' | 'updated_at'> {}

// Extend Sequelize Model Class
export class GroupCustomFieldDefinition extends Model<GroupCustomFieldDefinitionAttributes, GroupCustomFieldDefinitionCreationAttributes> implements GroupCustomFieldDefinitionAttributes {
    public uuid!: string
    public group_id!: string
    public name!: string
    public type!: 'text' | 'number' | 'dropdown' | 'date' | 'boolean'
    public required!: boolean
    public placeholder?: string
    public description?: string
    public options?: string[]
    public validation_rules?: {
        min_length?: number
        max_length?: number
        min_value?: number
        max_value?: number
        pattern?: string
    }
    public display_order!: number
    public is_active!: boolean
    public created_by!: string
    public readonly created_at!: Date
    public readonly updated_at!: Date

    // Define associations
    static associate(models: any) {
        // Group custom field definition belongs to a group
        GroupCustomFieldDefinition.belongsTo(models.Group, {
            foreignKey: 'group_id',
            as: 'group'
        })

        // Group custom field definition has many task custom fields
        GroupCustomFieldDefinition.hasMany(models.TaskCustomField, {
            foreignKey: 'field_definition_id',
            as: 'taskCustomFields'
        })
    }
}

GroupCustomFieldDefinition.init({
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
        },
        onDelete: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 100]
        }
    },
    type: {
        type: DataTypes.ENUM('text', 'number', 'dropdown', 'date', 'boolean'),
        allowNull: false,
        defaultValue: 'text'
    },
    required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    placeholder: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    options: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
    },
    validation_rules: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
    },
    display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    tableName: 'group_custom_field_definitions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: false,
            fields: ['group_id']
        },
        {
            unique: false,
            fields: ['group_id', 'display_order']
        },
        {
            unique: false,
            fields: ['group_id', 'is_active']
        },
        {
            unique: false,
            fields: ['created_by']
        }
    ]
})

export default GroupCustomFieldDefinition
