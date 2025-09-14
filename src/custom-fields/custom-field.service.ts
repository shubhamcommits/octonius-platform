// Sequelize Module
import { Op, Transaction } from 'sequelize'

// Import Database
import { db } from '../sequelize'

// Import Models
import { GroupCustomFieldDefinition } from './custom-field-definition.model'
import { TaskCustomField } from './task-custom-field.model'
import { Task } from '../groups/tasks/task.model'
import { Group } from '../groups/group.model'

// Import Logger
import logger from '../logger'

// Import Types
import {
    CustomFieldResponse,
    CreateGroupFieldDefinitionData,
    UpdateGroupFieldDefinitionData,
    CreateTaskCustomFieldData,
    UpdateTaskCustomFieldData,
    ReorderTaskCustomFieldsData
} from './custom-field.type'

export class CustomFieldService {
    /**
     * Creates a new group custom field definition
     */
    async createGroupFieldDefinition(
        groupId: string,
        fieldData: CreateGroupFieldDefinitionData,
        userId: string
    ): Promise<CustomFieldResponse<GroupCustomFieldDefinition>> {
        const transaction = await db.transaction()
        
        try {
            // Get the next display order
            const maxOrder = await GroupCustomFieldDefinition.max('display_order', {
                where: { group_id: groupId },
                transaction
            }) as number || 0

            // Create the field definition
            const fieldDefinition = await GroupCustomFieldDefinition.create({
                ...fieldData,
                group_id: groupId,
                created_by: userId,
                display_order: fieldData.display_order || maxOrder + 1
            }, { transaction })

            await transaction.commit()

            logger.info('Group custom field definition created', {
                fieldId: fieldDefinition.uuid,
                groupId,
                userId
            })

            return {
                success: true,
                message: 'Custom field definition created successfully',
                code: 201,
                data: fieldDefinition
            }
        } catch (error) {
            await transaction.rollback()
            logger.error('Error creating group custom field definition:', error)
            return {
                success: false,
                message: 'Failed to create custom field definition',
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Gets all group custom field definitions
     */
    async getGroupFieldDefinitions(
        groupId: string,
        includeInactive: boolean = false
    ): Promise<CustomFieldResponse<GroupCustomFieldDefinition[]>> {
        try {
            const whereClause: any = { group_id: groupId }
            if (!includeInactive) {
                whereClause.is_active = true
            }

            const fieldDefinitions = await GroupCustomFieldDefinition.findAll({
                where: whereClause,
                order: [['display_order', 'ASC']]
            })

            return {
                success: true,
                message: 'Custom field definitions retrieved successfully',
                code: 200,
                data: fieldDefinitions
            }
        } catch (error) {
            logger.error('Error getting group custom field definitions:', error)
            return {
                success: false,
                message: 'Failed to retrieve custom field definitions',
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Updates a group custom field definition
     */
    async updateGroupFieldDefinition(
        fieldId: string,
        fieldData: Partial<CreateGroupFieldDefinitionData>,
        userId: string
    ): Promise<CustomFieldResponse<GroupCustomFieldDefinition>> {
        const transaction = await db.transaction()
        
        try {
            const fieldDefinition = await GroupCustomFieldDefinition.findByPk(fieldId, { transaction })
            
            if (!fieldDefinition) {
                return {
                    success: false,
                    message: 'Custom field definition not found',
                    code: 404,
                    stack: new Error('Field definition not found')
                }
            }

            await fieldDefinition.update(fieldData, { transaction })
            await transaction.commit()

            logger.info('Group custom field definition updated', {
                fieldId,
                userId
            })

            return {
                success: true,
                message: 'Custom field definition updated successfully',
                code: 200,
                data: fieldDefinition
            }
        } catch (error) {
            await transaction.rollback()
            logger.error('Error updating group custom field definition:', error)
            return {
                success: false,
                message: 'Failed to update custom field definition',
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Deletes a group custom field definition
     */
    async deleteGroupFieldDefinition(
        fieldId: string,
        userId: string
    ): Promise<CustomFieldResponse<void>> {
        const transaction = await db.transaction()
        
        try {
            const fieldDefinition = await GroupCustomFieldDefinition.findByPk(fieldId, { transaction })
            
            if (!fieldDefinition) {
                return {
                    success: false,
                    message: 'Custom field definition not found',
                    code: 404,
                    stack: new Error('Field definition not found')
                }
            }

            // Delete all associated task custom fields
            await TaskCustomField.destroy({
                where: { field_definition_id: fieldId },
                transaction
            })

            // Delete the field definition
            await fieldDefinition.destroy({ transaction })
            await transaction.commit()

            logger.info('Group custom field definition deleted', {
                fieldId,
                userId
            })

            return {
                success: true,
                message: 'Custom field definition deleted successfully',
                code: 200
            }
        } catch (error) {
            await transaction.rollback()
            logger.error('Error deleting group custom field definition:', error)
            return {
                success: false,
                message: 'Failed to delete custom field definition',
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Creates or updates a task custom field
     */
    async upsertTaskCustomField(
        taskId: string,
        fieldData: CreateTaskCustomFieldData,
        userId: string
    ): Promise<CustomFieldResponse<TaskCustomField>> {
        const transaction = await db.transaction()
        
        try {
            // Check if field already exists
            let existingField: TaskCustomField | null = null
            
            if (fieldData.field_definition_id) {
                // For group fields, look by field_definition_id
                existingField = await TaskCustomField.findOne({
                    where: {
                        task_id: taskId,
                        field_definition_id: fieldData.field_definition_id
                    },
                    transaction
                })
            } else {
                // For task-specific fields, look by field_name
                existingField = await TaskCustomField.findOne({
                    where: {
                        task_id: taskId,
                        field_name: fieldData.field_name,
                        is_group_field: false
                    },
                    transaction
                })
            }

            let taskCustomField: TaskCustomField

            if (existingField) {
                // Update existing field
                await existingField.update({
                    field_value: fieldData.field_value,
                    field_type: fieldData.field_type,
                    display_order: fieldData.display_order || existingField.display_order
                }, { transaction })
                taskCustomField = existingField
            } else {
                // Get the next display order
                const maxOrder = await TaskCustomField.max('display_order', {
                    where: { task_id: taskId },
                    transaction
                }) as number || 0

                // Create new field
                taskCustomField = await TaskCustomField.create({
                    ...fieldData,
                    task_id: taskId,
                    created_by: userId,
                    display_order: fieldData.display_order || maxOrder + 1
                }, { transaction })
            }

            await transaction.commit()

            logger.info('Task custom field upserted', {
                fieldId: taskCustomField.uuid,
                taskId,
                userId
            })

            return {
                success: true,
                message: 'Custom field saved successfully',
                code: 200,
                data: taskCustomField
            }
        } catch (error) {
            await transaction.rollback()
            logger.error('Error upserting task custom field:', error)
            return {
                success: false,
                message: 'Failed to save custom field',
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Gets all custom fields for a task (both group and task-specific)
     */
    async getTaskCustomFields(
        taskId: string
    ): Promise<CustomFieldResponse<TaskCustomField[]>> {
        try {
            const customFields = await TaskCustomField.findAll({
                where: { task_id: taskId },
                include: [
                    {
                        model: GroupCustomFieldDefinition,
                        as: 'fieldDefinition',
                        attributes: ['uuid', 'name', 'type', 'required', 'placeholder', 'description', 'options', 'validation_rules']
                    }
                ],
                order: [['display_order', 'ASC']]
            })

            return {
                success: true,
                message: 'Task custom fields retrieved successfully',
                code: 200,
                data: customFields
            }
        } catch (error) {
            logger.error('Error getting task custom fields:', error)
            return {
                success: false,
                message: 'Failed to retrieve task custom fields',
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Deletes a task custom field
     */
    async deleteTaskCustomField(
        fieldId: string,
        userId: string
    ): Promise<CustomFieldResponse<void>> {
        const transaction = await db.transaction()
        
        try {
            const customField = await TaskCustomField.findByPk(fieldId, { transaction })
            
            if (!customField) {
                return {
                    success: false,
                    message: 'Custom field not found',
                    code: 404,
                    stack: new Error('Custom field not found')
                }
            }

            await customField.destroy({ transaction })
            await transaction.commit()

            logger.info('Task custom field deleted', {
                fieldId,
                userId
            })

            return {
                success: true,
                message: 'Custom field deleted successfully',
                code: 200
            }
        } catch (error) {
            await transaction.rollback()
            logger.error('Error deleting task custom field:', error)
            return {
                success: false,
                message: 'Failed to delete custom field',
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Reorders custom fields for a task
     */
    async reorderTaskCustomFields(
        taskId: string,
        fieldOrders: { fieldId: string; display_order: number }[],
        userId: string
    ): Promise<CustomFieldResponse<void>> {
        const transaction = await db.transaction()
        
        try {
            for (const fieldOrder of fieldOrders) {
                await TaskCustomField.update(
                    { display_order: fieldOrder.display_order },
                    {
                        where: {
                            uuid: fieldOrder.fieldId,
                            task_id: taskId
                        },
                        transaction
                    }
                )
            }

            await transaction.commit()

            logger.info('Task custom fields reordered', {
                taskId,
                userId
            })

            return {
                success: true,
                message: 'Custom fields reordered successfully',
                code: 200
            }
        } catch (error) {
            await transaction.rollback()
            logger.error('Error reordering task custom fields:', error)
            return {
                success: false,
                message: 'Failed to reorder custom fields',
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Gets group custom field templates for task creation
     */
    async getGroupTemplatesForTaskCreation(
        groupId: string
    ): Promise<CustomFieldResponse<GroupCustomFieldDefinition[]>> {
        try {
            const fieldDefinitions = await GroupCustomFieldDefinition.findAll({
                where: {
                    group_id: groupId,
                    is_active: true
                },
                order: [['display_order', 'ASC']]
            })

            return {
                success: true,
                message: 'Group custom field templates retrieved successfully',
                code: 200,
                data: fieldDefinitions
            }
        } catch (error) {
            logger.error('Error getting group templates for task creation:', error)
            return {
                success: false,
                message: 'Failed to retrieve group templates',
                code: 500,
                stack: error as Error
            }
        }
    }
}

// Export a singleton instance of the CustomFieldService
export default new CustomFieldService()
