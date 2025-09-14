import { Request, Response } from 'express'
import { CustomFieldService } from './custom-field.service'
import { CreateGroupFieldDefinitionData, CreateTaskCustomFieldData } from './custom-field.type'
import logger from '../logger'

export class CustomFieldController {
    private readonly customFieldService: CustomFieldService

    constructor(customFieldService: CustomFieldService) {
        this.customFieldService = customFieldService
    }

    /**
     * Creates a new group custom field definition
     */
    async createGroupFieldDefinition(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Creating group custom field definition', {
                method: req.method,
                path: req.path,
                groupId: req.params.group_id,
                userId: req.user?.uuid,
                ip: req.ip
            })

            const { group_id } = req.params
            const fieldData: CreateGroupFieldDefinitionData = req.body
            const userId = req.user!.uuid

            // Validate required fields
            if (!fieldData.name?.trim()) {
                const responseTime = Date.now() - startTime
                return res.status(400).json({
                    success: false,
                    message: 'Field name is required',
                    meta: { responseTime: `${responseTime}ms` }
                })
            }

            if (!fieldData.type) {
                const responseTime = Date.now() - startTime
                return res.status(400).json({
                    success: false,
                    message: 'Field type is required',
                    meta: { responseTime: `${responseTime}ms` }
                })
            }

            const result = await this.customFieldService.createGroupFieldDefinition(
                group_id,
                fieldData,
                userId
            )

            const responseTime = Date.now() - startTime

            if (result.success) {
                logger.info('Group custom field definition created successfully', {
                    fieldId: result.data?.uuid,
                    groupId: group_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    data: result.data,
                    meta: { responseTime: `${responseTime}ms` }
                })
            } else {
                logger.error('Failed to create group custom field definition', {
                    error: result.stack,
                    groupId: group_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    meta: { responseTime: `${responseTime}ms` }
                })
            }
        } catch (error) {
            const responseTime = Date.now() - startTime
            logger.error('Error in createGroupFieldDefinition:', error)
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    /**
     * Gets all group custom field definitions
     */
    async getGroupFieldDefinitions(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Getting group custom field definitions', {
                method: req.method,
                path: req.path,
                groupId: req.params.group_id,
                userId: req.user?.uuid,
                ip: req.ip
            })

            const { group_id } = req.params
            const includeInactive = req.query.include_inactive === 'true'

            const result = await this.customFieldService.getGroupFieldDefinitions(
                group_id,
                includeInactive
            )

            const responseTime = Date.now() - startTime

            if (result.success) {
                logger.info('Group custom field definitions retrieved successfully', {
                    groupId: group_id,
                    count: result.data?.length || 0,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    data: result.data,
                    meta: { responseTime: `${responseTime}ms` }
                })
            } else {
                logger.error('Failed to get group custom field definitions', {
                    error: result.stack,
                    groupId: group_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    meta: { responseTime: `${responseTime}ms` }
                })
            }
        } catch (error) {
            const responseTime = Date.now() - startTime
            logger.error('Error in getGroupFieldDefinitions:', error)
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    /**
     * Updates a group custom field definition
     */
    async updateGroupFieldDefinition(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Updating group custom field definition', {
                method: req.method,
                path: req.path,
                fieldId: req.params.field_id,
                userId: req.user?.uuid,
                ip: req.ip
            })

            const { field_id } = req.params
            const fieldData: Partial<CreateGroupFieldDefinitionData> = req.body
            const userId = req.user!.uuid

            const result = await this.customFieldService.updateGroupFieldDefinition(
                field_id,
                fieldData,
                userId
            )

            const responseTime = Date.now() - startTime

            if (result.success) {
                logger.info('Group custom field definition updated successfully', {
                    fieldId: field_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    data: result.data,
                    meta: { responseTime: `${responseTime}ms` }
                })
            } else {
                logger.error('Failed to update group custom field definition', {
                    error: result.stack,
                    fieldId: field_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    meta: { responseTime: `${responseTime}ms` }
                })
            }
        } catch (error) {
            const responseTime = Date.now() - startTime
            logger.error('Error in updateGroupFieldDefinition:', error)
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    /**
     * Deletes a group custom field definition
     */
    async deleteGroupFieldDefinition(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Deleting group custom field definition', {
                method: req.method,
                path: req.path,
                fieldId: req.params.field_id,
                userId: req.user?.uuid,
                ip: req.ip
            })

            const { field_id } = req.params
            const userId = req.user!.uuid

            const result = await this.customFieldService.deleteGroupFieldDefinition(
                field_id,
                userId
            )

            const responseTime = Date.now() - startTime

            if (result.success) {
                logger.info('Group custom field definition deleted successfully', {
                    fieldId: field_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    meta: { responseTime: `${responseTime}ms` }
                })
            } else {
                logger.error('Failed to delete group custom field definition', {
                    error: result.stack,
                    fieldId: field_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    meta: { responseTime: `${responseTime}ms` }
                })
            }
        } catch (error) {
            const responseTime = Date.now() - startTime
            logger.error('Error in deleteGroupFieldDefinition:', error)
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    /**
     * Creates or updates a task custom field
     */
    async upsertTaskCustomField(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Upserting task custom field', {
                method: req.method,
                path: req.path,
                taskId: req.params.task_id,
                userId: req.user?.uuid,
                ip: req.ip
            })

            const { task_id } = req.params
            const fieldData: CreateTaskCustomFieldData = req.body
            const userId = req.user!.uuid

            // Validate required fields
            if (!fieldData.field_name?.trim()) {
                const responseTime = Date.now() - startTime
                return res.status(400).json({
                    success: false,
                    message: 'Field name is required',
                    meta: { responseTime: `${responseTime}ms` }
                })
            }

            if (!fieldData.field_value?.trim()) {
                const responseTime = Date.now() - startTime
                return res.status(400).json({
                    success: false,
                    message: 'Field value is required',
                    meta: { responseTime: `${responseTime}ms` }
                })
            }

            const result = await this.customFieldService.upsertTaskCustomField(
                task_id,
                fieldData,
                userId
            )

            const responseTime = Date.now() - startTime

            if (result.success) {
                logger.info('Task custom field upserted successfully', {
                    fieldId: result.data?.uuid,
                    taskId: task_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    data: result.data,
                    meta: { responseTime: `${responseTime}ms` }
                })
            } else {
                logger.error('Failed to upsert task custom field', {
                    error: result.stack,
                    taskId: task_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    meta: { responseTime: `${responseTime}ms` }
                })
            }
        } catch (error) {
            const responseTime = Date.now() - startTime
            logger.error('Error in upsertTaskCustomField:', error)
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    /**
     * Gets all custom fields for a task
     */
    async getTaskCustomFields(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Getting task custom fields', {
                method: req.method,
                path: req.path,
                taskId: req.params.task_id,
                userId: req.user?.uuid,
                ip: req.ip
            })

            const { task_id } = req.params

            const result = await this.customFieldService.getTaskCustomFields(task_id)

            const responseTime = Date.now() - startTime

            if (result.success) {
                logger.info('Task custom fields retrieved successfully', {
                    taskId: task_id,
                    count: result.data?.length || 0,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    data: result.data,
                    meta: { responseTime: `${responseTime}ms` }
                })
            } else {
                logger.error('Failed to get task custom fields', {
                    error: result.stack,
                    taskId: task_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    meta: { responseTime: `${responseTime}ms` }
                })
            }
        } catch (error) {
            const responseTime = Date.now() - startTime
            logger.error('Error in getTaskCustomFields:', error)
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    /**
     * Deletes a task custom field
     */
    async deleteTaskCustomField(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Deleting task custom field', {
                method: req.method,
                path: req.path,
                fieldId: req.params.field_id,
                userId: req.user?.uuid,
                ip: req.ip
            })

            const { field_id } = req.params
            const userId = req.user!.uuid

            const result = await this.customFieldService.deleteTaskCustomField(
                field_id,
                userId
            )

            const responseTime = Date.now() - startTime

            if (result.success) {
                logger.info('Task custom field deleted successfully', {
                    fieldId: field_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    meta: { responseTime: `${responseTime}ms` }
                })
            } else {
                logger.error('Failed to delete task custom field', {
                    error: result.stack,
                    fieldId: field_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    meta: { responseTime: `${responseTime}ms` }
                })
            }
        } catch (error) {
            const responseTime = Date.now() - startTime
            logger.error('Error in deleteTaskCustomField:', error)
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    /**
     * Reorders task custom fields
     */
    async reorderTaskCustomFields(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Reordering task custom fields', {
                method: req.method,
                path: req.path,
                taskId: req.params.task_id,
                userId: req.user?.uuid,
                ip: req.ip
            })

            const { task_id } = req.params
            const { field_orders } = req.body
            const userId = req.user!.uuid

            if (!Array.isArray(field_orders)) {
                const responseTime = Date.now() - startTime
                return res.status(400).json({
                    success: false,
                    message: 'Field orders must be an array',
                    meta: { responseTime: `${responseTime}ms` }
                })
            }

            const result = await this.customFieldService.reorderTaskCustomFields(
                task_id,
                field_orders,
                userId
            )

            const responseTime = Date.now() - startTime

            if (result.success) {
                logger.info('Task custom fields reordered successfully', {
                    taskId: task_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    meta: { responseTime: `${responseTime}ms` }
                })
            } else {
                logger.error('Failed to reorder task custom fields', {
                    error: result.stack,
                    taskId: task_id,
                    responseTime: `${responseTime}ms`,
                    statusCode: result.code
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    meta: { responseTime: `${responseTime}ms` }
                })
            }
        } catch (error) {
            const responseTime = Date.now() - startTime
            logger.error('Error in reorderTaskCustomFields:', error)
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }

    /**
     * Gets group custom field templates for task creation
     */
    async getGroupTemplatesForTaskCreation(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Getting group custom field templates for task creation', {
                method: req.method,
                path: req.path,
                groupId: req.params.group_id,
                userId: req.user?.uuid,
                ip: req.ip
            })

            const { group_id } = req.params

            const result = await this.customFieldService.getGroupTemplatesForTaskCreation(group_id)

            const responseTime = Date.now() - startTime

            if (result.success) {
                logger.info('Group custom field templates retrieved successfully', {
                    groupId: group_id,
                    userId: req.user?.uuid,
                    templateCount: result.data?.length || 0,
                    responseTime: `${responseTime}ms`
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    data: result.data,
                    meta: { responseTime: `${responseTime}ms` }
                })
            } else {
                logger.error('Failed to get group custom field templates', {
                    groupId: group_id,
                    userId: req.user?.uuid,
                    error: result.stack,
                    responseTime: `${responseTime}ms`
                })

                return res.status(result.code).json({
                    success: result.success,
                    message: result.message,
                    meta: { responseTime: `${responseTime}ms` }
                })
            }
        } catch (error) {
            const responseTime = Date.now() - startTime
            
            logger.error('Error in getGroupTemplatesForTaskCreation controller', {
                error,
                groupId: req.params.group_id,
                userId: req.user?.uuid,
                responseTime: `${responseTime}ms`
            })

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                meta: { responseTime: `${responseTime}ms` }
            })
        }
    }
}

export default CustomFieldController
