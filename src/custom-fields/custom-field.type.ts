// Custom Field Types
export interface CreateGroupFieldDefinitionData {
    group_id: string
    name: string
    type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean'
    required: boolean
    placeholder?: string
    description?: string
    options?: string[]
    validation_rules?: Record<string, any>
    display_order?: number
}

export interface UpdateGroupFieldDefinitionData {
    name?: string
    type?: 'text' | 'number' | 'dropdown' | 'date' | 'boolean'
    required?: boolean
    placeholder?: string
    description?: string
    options?: string[]
    validation_rules?: Record<string, any>
    display_order?: number
    is_active?: boolean
}

export interface CreateTaskCustomFieldData {
    task_id: string
    field_definition_id?: string
    field_name: string
    field_value: string
    field_type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean'
    is_group_field: boolean
    display_order?: number
}

export interface UpdateTaskCustomFieldData {
    field_name?: string
    field_value?: string
    field_type?: 'text' | 'number' | 'dropdown' | 'date' | 'boolean'
    display_order?: number
}

export interface ReorderTaskCustomFieldsData {
    field_orders: Array<{
        field_id: string
        display_order: number
    }>
}

// API Response Types
export interface CustomFieldResponse<T = any> {
    success: boolean
    message: string
    code: number
    data?: T
    stack?: Error
}

// Frontend Types (matching the service)
export interface GroupCustomFieldDefinition {
    uuid: string
    group_id: string
    name: string
    type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean'
    required: boolean
    placeholder?: string
    description?: string
    options?: string[]
    validation_rules?: Record<string, any>
    display_order: number
    is_active: boolean
    created_by: string
    created_at: string
    updated_at: string
}

export interface TaskCustomField {
    uuid: string
    task_id: string
    field_definition_id?: string
    field_name: string
    field_value: string
    field_type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean'
    is_group_field: boolean
    display_order: number
    created_by: string
    created_at: string
    updated_at: string
}
