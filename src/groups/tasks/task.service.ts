// Sequelize Module
import { Op, Transaction } from 'sequelize'

// Import Database
import { db } from '../../sequelize'

// Import Models
import Task from './task.model'
import TaskColumn from './task-column.model'
import User from '../../users/user.model'
import Group from '../group.model'
import GroupMembership from '../group-membership.model'
import TaskAssignee from './task-assignee.model'

// Import Logger
import logger from '../../logger'

// Import Task Codes
import { TaskCode } from './task.code'

// Import Task Types
import {
    TaskResponse,
    TasksResponse,
    ColumnResponse,
    ColumnsResponse,
    BoardResponse,
    TaskCreationData,
    TaskUpdateData,
    TaskMoveData,
    ColumnCreationData,
    ColumnUpdateData
} from './task.type'

// Import Task Comment Model
import { TaskComment } from './task-comment.model'

// Import Types
import { TaskCommentResponse, TaskCommentsResponse, TaskCommentError, TaskCommentCreateData, TaskCommentUpdateData } from './task-comment.type'

// Import Codes
import { TaskCommentCode } from './task-comment.code'

// Import Custom Field Service
import customFieldService from '../../custom-fields/custom-field.service'
import { GroupCustomFieldDefinition } from '../../custom-fields/custom-field-definition.model'
import { TaskCustomField } from '../../custom-fields/task-custom-field.model'

/**
 * Service class for handling all task-related operations.
 * This includes CRUD operations for tasks and columns, board management, and task assignments.
 */
export class TaskService {
    /**
     * Creates a new task in a group.
     * 
     * @param groupId - The UUID of the group
     * @param taskData - The task data to be created
     * @param userId - The UUID of the user creating the task
     * @returns A response containing the newly created task
     * @throws TaskError if the task creation process fails
     */
    async createTask(
        groupId: string,
        taskData: TaskCreationData,
        userId: string
    ): Promise<TaskResponse<Task>> {
        const transaction = await db.transaction()
        
        try {
            // Validates that the column exists and belongs to the group
            const column = await TaskColumn.findOne({
                where: {
                    uuid: taskData.column_id,
                    group_id: groupId
                },
                transaction
            })

            if (!column) {
                throw {
                    success: false,
                    message: TaskCode.COLUMN_NOT_FOUND,
                    code: 404,
                    stack: new Error('Column not found or does not belong to this group')
                }
            }

            // Get group to validate custom fields against definitions
            const group = await Group.findByPk(groupId, { transaction })
            if (!group) {
                throw {
                    success: false,
                    message: TaskCode.GROUP_NOT_FOUND,
                    code: 404,
                    stack: new Error('Group not found')
                }
            }

            // Gets the next position for the task in the column
            const maxPosition = await Task.max('position', {
                where: { column_id: taskData.column_id },
                transaction
            }) as number || 0

            // Creates the task
            const task = await Task.create({
                ...taskData,
                group_id: groupId,
                created_by: userId,
                position: maxPosition + 1,
                status: taskData.status || 'todo',
                metadata: taskData.metadata || {}
            }, { transaction })

            // Inherit group custom field templates and create task instances
            await this.inheritGroupCustomFieldTemplates(task.uuid, groupId, userId, transaction)

            // Process any custom fields provided in the task data
            if (taskData.metadata?.custom_fields) {
                await this.processTaskCustomFields(
                    task.uuid, 
                    taskData.metadata.custom_fields, 
                    userId, 
                    transaction
                )
            }

            // Fetches the created task with associations
            const createdTask = await Task.findByPk(task.uuid, {
                include: [
                    { model: User, as: 'creator', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: User, as: 'assignees', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: TaskColumn, as: 'column', attributes: ['uuid', 'name', 'color'] }
                ],
                transaction
            })

            await transaction.commit()

            // Logs success
            logger.info('Task created successfully', { taskId: task.uuid, groupId, userId })

            // Returns success response
            return {
                success: true,
                message: TaskCode.TASK_CREATED,
                code: 201,
                task: createdTask!
            }
        } catch (error) {
            await transaction.rollback()
            
            // Logs error
            logger.error('Task creation failed', { error, groupId, taskData, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Retrieves all tasks for a group organized by columns (board view).
     * 
     * @param groupId - The UUID of the group
     * @param userId - The UUID of the requesting user
     * @returns A response containing the board with columns and tasks
     * @throws TaskError if the retrieval process fails
     */
    async getBoard(groupId: string, userId: string): Promise<BoardResponse<any>> {
        try {
            // Fetches all columns with their tasks
            const columns = await TaskColumn.findAll({
                where: { group_id: groupId },
                include: [{
                    model: Task,
                    as: 'tasks',
                    include: [
                        { model: User, as: 'creator', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                        { model: User, as: 'assignees', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] }
                    ]
                }],
                order: [
                    ['position', 'ASC'],
                    [{ model: Task, as: 'tasks' }, 'created_at', 'DESC'],
                    [{ model: Task, as: 'tasks' }, 'uuid', 'ASC']
                ]
            })

            // Get custom fields for all tasks
            const taskIds = columns.flatMap(col => (col.get('tasks') as Task[]).map(task => task.uuid))
            const customFields = await TaskCustomField.findAll({
                where: { task_id: { [Op.in]: taskIds } },
                include: [
                    {
                        model: GroupCustomFieldDefinition,
                        as: 'fieldDefinition',
                        attributes: ['uuid', 'name', 'type', 'required', 'placeholder', 'description', 'options', 'validation_rules']
                    }
                ],
                order: [['display_order', 'ASC']]
            })

            // Group custom fields by task_id
            const customFieldsByTask = customFields.reduce((acc, field) => {
                if (!acc[field.task_id]) {
                    acc[field.task_id] = []
                }
                acc[field.task_id].push(field)
                return acc
            }, {} as Record<string, any[]>)

            // Add custom fields to each task
            columns.forEach(column => {
                const tasks = column.get('tasks') as Task[]
                tasks.forEach(task => {
                    (task as any).custom_fields = customFieldsByTask[task.uuid] || []
                })
            })

            // Formats the board data
            const board = {
                columns: columns.map(column => ({
                    id: column.uuid,
                    name: column.name,
                    color: column.color,
                    tasks: column.get('tasks') || []
                }))
            }

            // Returns success response
            return {
                success: true,
                message: TaskCode.TASKS_FOUND,
                code: 200,
                board
            }
        } catch (error) {
            // Logs error
            logger.error('Board retrieval failed', { error, groupId, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Gets a specific task by ID with all related data.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task
     * @returns A response containing the task with all related data
     * @throws TaskError if the task retrieval process fails
     */
    async getTask(groupId: string, taskId: string): Promise<TaskResponse<Task>> {
        try {
            // Queries the database for the task
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                },
                include: [
                    { model: User, as: 'creator', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: TaskColumn, as: 'column', attributes: ['uuid', 'name', 'color'] },
                    { 
                        model: User, 
                        as: 'assignees', 
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'],
                        through: { attributes: ['assigned_at', 'assigned_by'] }
                    }
                ]
            })

            // Get custom fields for the task
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

            // Add custom fields to task data
            if (task) {
                (task as any).custom_fields = customFields
            }

            // Checks if task exists
            if (!task) {
                throw {
                    success: false,
                    message: TaskCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            // Returns success response
            return {
                success: true,
                message: TaskCode.TASK_FOUND,
                code: 200,
                task: task as any
            }
        } catch (error) {
            // Logs error
            logger.error('Task retrieval failed', { error, groupId, taskId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Updates an existing task.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task to update
     * @param updateData - The data to update
     * @param userId - The UUID of the user performing the update
     * @returns A response containing the updated task
     * @throws TaskError if the update process fails
     */
    async updateTask(
        groupId: string,
        taskId: string,
        updateData: TaskUpdateData,
        userId: string
    ): Promise<TaskResponse<Task>> {
        try {
            // Log the incoming update data
            logger.info('Task update request', { 
                taskId, 
                groupId, 
                userId, 
                updateData,
                dueDateReceived: updateData.due_date,
                dueDateType: typeof updateData.due_date
            })

            // Finds the task
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                }
            })

            if (!task) {
                throw {
                    success: false,
                    message: TaskCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            // Log the current task state
            logger.info('Current task state', { 
                taskId, 
                currentDueDate: task.due_date,
                currentDueDateType: typeof task.due_date
            })

            // Updates task completion status if changing to done
            if (updateData.status === 'done' && task.status !== 'done') {
                updateData.completed_at = new Date()
                updateData.completed_by = userId
            } else if (updateData.status !== 'done' && task.status === 'done') {
                updateData.completed_at = null
                updateData.completed_by = null
            }

            // Updates the task
            await task.update(updateData)

            // Fetches updated task with associations
            const updatedTask = await Task.findByPk(task.uuid, {
                include: [
                    { model: User, as: 'creator', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: TaskColumn, as: 'column', attributes: ['uuid', 'name', 'color'] },
                    { 
                        model: User, 
                        as: 'assignees', 
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'],
                        through: { attributes: ['assigned_at', 'assigned_by'] }
                    }
                ]
            })

            // Log the updated task state
            logger.info('Updated task state', { 
                taskId, 
                updatedDueDate: updatedTask?.due_date,
                updatedDueDateType: typeof updatedTask?.due_date
            })

            // Logs success
            logger.info('Task updated successfully', { taskId, groupId, userId })

            // Returns success response
            return {
                success: true,
                message: TaskCode.TASK_UPDATED,
                code: 200,
                task: updatedTask! as any
            }
        } catch (error) {
            // Logs error
            logger.error('Task update failed', { error, groupId, taskId, updateData, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Moves a task to a different column or position.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task to move
     * @param moveData - The column and position to move to
     * @param userId - The UUID of the user performing the move
     * @returns A response containing the moved task
     * @throws TaskError if the move process fails
     */
    async moveTask(
        groupId: string,
        taskId: string,
        moveData: TaskMoveData,
        userId: string
    ): Promise<TaskResponse<Task>> {
        const transaction = await db.transaction()
        
        try {
            // Validates that the target column exists and belongs to the group
            const column = await TaskColumn.findOne({
                where: {
                    uuid: moveData.column_id,
                    group_id: groupId
                },
                transaction
            })

            if (!column) {
                throw {
                    success: false,
                    message: TaskCode.COLUMN_NOT_FOUND,
                    code: 404,
                    stack: new Error('Target column not found or does not belong to this group')
                }
            }

            // Finds the task
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                },
                transaction
            })

            if (!task) {
                throw {
                    success: false,
                    message: TaskCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            const oldColumnId = task.column_id
            const oldPosition = task.position

            // Updates positions in the old column
            if (oldColumnId !== moveData.column_id) {
                await Task.update(
                    { position: db.literal('position - 1') },
                    {
                        where: {
                            column_id: oldColumnId,
                            position: { [Op.gt]: oldPosition }
                        },
                        transaction
                    }
                )
            }

            // Updates positions in the new column
            await Task.update(
                { position: db.literal('position + 1') },
                {
                    where: {
                        column_id: moveData.column_id,
                        position: { [Op.gte]: moveData.position }
                    },
                    transaction
                }
            )

            // Determine the new status based on the column name
            let newStatus = task.status // Keep current status by default
            const columnName = column.name.toLowerCase()
            
            if (columnName.includes('to do') || columnName.includes('todo')) {
                newStatus = 'todo'
            } else if (columnName.includes('in progress') || columnName.includes('progress')) {
                newStatus = 'in_progress'
            } else if (columnName.includes('review')) {
                newStatus = 'review'
            } else if (columnName.includes('done') || columnName.includes('complete')) {
                newStatus = 'done'
            }

            // Update completion fields if moving to/from done status
            let updateData: any = {
                column_id: moveData.column_id,
                position: moveData.position,
                status: newStatus
            }

            // If moving to done status and not already done
            if (newStatus === 'done' && task.status !== 'done') {
                updateData.completed_at = new Date()
                updateData.completed_by = userId
            } 
            // If moving away from done status
            else if (newStatus !== 'done' && task.status === 'done') {
                updateData.completed_at = null
                updateData.completed_by = null
            }

            // Updates the task
            await task.update(updateData, { transaction })

            await transaction.commit()

            // Fetches updated task with associations
            const movedTask = await Task.findByPk(task.uuid, {
                include: [
                    { model: User, as: 'creator', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: TaskColumn, as: 'column', attributes: ['uuid', 'name', 'color'] },
                    { 
                        model: User, 
                        as: 'assignees', 
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'],
                        through: { attributes: ['assigned_at', 'assigned_by'] }
                    }
                ]
            })

            // Logs success
            logger.info('Task moved successfully', { taskId, groupId, moveData, userId, newStatus })

            // Returns success response
            return {
                success: true,
                message: TaskCode.TASK_MOVED,
                code: 200,
                task: movedTask! as any
            }
        } catch (error) {
            await transaction.rollback()
            
            // Logs error
            logger.error('Task move failed', { error, groupId, taskId, moveData, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Deletes a task from the system.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task to delete
     * @param userId - The UUID of the user performing the deletion
     * @returns A response indicating successful deletion
     * @throws TaskError if the deletion process fails
     */
    async deleteTask(
        groupId: string,
        taskId: string,
        userId: string
    ): Promise<TaskResponse<{ uuid: string }>> {
        const transaction = await db.transaction()
        
        try {
            // Finds the task
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                },
                transaction
            })

            if (!task) {
                throw {
                    success: false,
                    message: TaskCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            const columnId = task.column_id
            const position = task.position

            // Deletes the task
            await task.destroy({ transaction })

            // Updates positions of remaining tasks
            await Task.update(
                { position: db.literal('position - 1') },
                {
                    where: {
                        column_id: columnId,
                        position: { [Op.gt]: position }
                    },
                    transaction
                }
            )

            await transaction.commit()

            // Logs success
            logger.info('Task deleted successfully', { taskId, groupId, userId })

            // Returns success response
            return {
                success: true,
                message: TaskCode.TASK_DELETED,
                code: 200,
                task: { uuid: taskId }
            }
        } catch (error) {
            await transaction.rollback()
            
            // Logs error
            logger.error('Task deletion failed', { error, groupId, taskId, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Creates a new column for the task board.
     * 
     * @param groupId - The UUID of the group
     * @param columnData - The column data to be created
     * @param userId - The UUID of the user creating the column
     * @returns A response containing the newly created column
     * @throws TaskError if the column creation process fails
     */
    async createColumn(
        groupId: string,
        columnData: ColumnCreationData,
        userId: string
    ): Promise<ColumnResponse<TaskColumn>> {
        try {
            // Gets the next position for the column
            const maxPosition = await TaskColumn.max('position', {
                where: { group_id: groupId }
            }) as number || 0

            // Creates the column
            const column = await TaskColumn.create({
                ...columnData,
                group_id: groupId,
                created_by: userId,
                position: columnData.position ?? maxPosition + 1
            })

            // Logs success
            logger.info('Column created successfully', { columnId: column.uuid, groupId, userId })

            // Returns success response
            return {
                success: true,
                message: TaskCode.COLUMN_CREATED,
                code: 201,
                column
            }
        } catch (error) {
            // Logs error
            logger.error('Column creation failed', { error, groupId, columnData, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Updates an existing column.
     * 
     * @param groupId - The UUID of the group
     * @param columnId - The UUID of the column to update
     * @param updateData - The data to update
     * @param userId - The UUID of the user performing the update
     * @returns A response containing the updated column
     * @throws TaskError if the update process fails
     */
    async updateColumn(
        groupId: string,
        columnId: string,
        updateData: ColumnUpdateData,
        userId: string
    ): Promise<ColumnResponse<TaskColumn>> {
        try {
            // Finds the column
            const column = await TaskColumn.findOne({
                where: {
                    uuid: columnId,
                    group_id: groupId
                }
            })

            if (!column) {
                throw {
                    success: false,
                    message: TaskCode.COLUMN_NOT_FOUND,
                    code: 404,
                    stack: new Error('Column not found in this group')
                }
            }

            // Updates the column
            await column.update(updateData)

            // Logs success
            logger.info('Column updated successfully', { columnId, groupId, userId })

            // Returns success response
            return {
                success: true,
                message: TaskCode.COLUMN_UPDATED,
                code: 200,
                column
            }
        } catch (error) {
            // Logs error
            logger.error('Column update failed', { error, groupId, columnId, updateData, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Deletes a column from the board.
     * 
     * @param groupId - The UUID of the group
     * @param columnId - The UUID of the column to delete
     * @param userId - The UUID of the user performing the deletion
     * @returns A response indicating successful deletion
     * @throws TaskError if the deletion process fails
     */
    async deleteColumn(
        groupId: string,
        columnId: string,
        userId: string
    ): Promise<ColumnResponse<{ uuid: string }>> {
        const transaction = await db.transaction()
        
        try {
            // Finds the column
            const column = await TaskColumn.findOne({
                where: {
                    uuid: columnId,
                    group_id: groupId
                },
                transaction
            })

            if (!column) {
                throw {
                    success: false,
                    message: TaskCode.COLUMN_NOT_FOUND,
                    code: 404,
                    stack: new Error('Column not found in this group')
                }
            }

            // Checks if column is default
            if (column.is_default) {
                throw {
                    success: false,
                    message: TaskCode.CANNOT_DELETE_DEFAULT_COLUMN,
                    code: 400,
                    stack: new Error('Cannot delete default column')
                }
            }

            // Checks if column has tasks
            const taskCount = await Task.count({
                where: { column_id: columnId },
                transaction
            })

            if (taskCount > 0) {
                throw {
                    success: false,
                    message: TaskCode.COLUMN_HAS_TASKS,
                    code: 400,
                    stack: new Error('Column has tasks')
                }
            }

            const position = column.position

            // Deletes the column
            await column.destroy({ transaction })

            // Updates positions of remaining columns
            await TaskColumn.update(
                { position: db.literal('position - 1') },
                {
                    where: {
                        group_id: groupId,
                        position: { [Op.gt]: position }
                    },
                    transaction
                }
            )

            await transaction.commit()

            // Logs success
            logger.info('Column deleted successfully', { columnId, groupId, userId })

            // Returns success response
            return {
                success: true,
                message: TaskCode.COLUMN_DELETED,
                code: 200,
                column: { uuid: columnId }
            }
        } catch (error) {
            await transaction.rollback()
            
            // Logs error
            logger.error('Column deletion failed', { error, groupId, columnId, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Creates default columns for a new group.
     * 
     * @param groupId - The UUID of the group
     * @param userId - The UUID of the user creating the group
     * @returns A response indicating successful creation
     */
    async createDefaultColumns(groupId: string, userId: string): Promise<void> {
        try {
            const defaultColumns = [
                { name: 'To Do', color: '#757575', position: 1, is_default: true },
                { name: 'In Progress', color: '#FBC02D', position: 2, is_default: true },
                { name: 'Done', color: '#66BB6A', position: 3, is_default: true }
            ]

            await TaskColumn.bulkCreate(
                defaultColumns.map(col => ({
                    ...col,
                    group_id: groupId,
                    created_by: userId
                }))
            )

            logger.info('Default columns created for group', { groupId, userId })
        } catch (error) {
            logger.error('Failed to create default columns', { error, groupId, userId })
            // Don't throw error as this is not critical
        }
    }

    /**
     * Gets all comments for a specific task.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task
     * @returns A response containing the task comments
     * @throws TaskCommentError if the retrieval process fails
     */
    async getTaskComments(groupId: string, taskId: string): Promise<TaskCommentsResponse<TaskComment>> {
        try {
            // Validates that the task exists and belongs to the group
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                }
            })

            if (!task) {
                throw {
                    success: false,
                    message: TaskCommentCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            // Retrieves all comments for the task
            const comments = await TaskComment.findAll({
                where: { task_id: taskId },
                include: [
                    { model: User, as: 'user', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] }
                ],
                order: [['created_at', 'ASC']]
            })

            // Logs success
            logger.info('Task comments retrieved successfully', { taskId, groupId, commentCount: comments.length })

            // Returns success response
            return {
                success: true,
                message: TaskCommentCode.COMMENTS_FOUND,
                code: 200,
                comments
            }
        } catch (error) {
            // Logs error
            logger.error('Task comments retrieval failed', { error, groupId, taskId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCommentCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Creates a new comment for a task.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task
     * @param commentData - The comment data to be created
     * @param userId - The UUID of the user creating the comment
     * @returns A response containing the newly created comment
     * @throws TaskCommentError if the creation process fails
     */
    async createTaskComment(
        groupId: string,
        taskId: string,
        commentData: TaskCommentCreateData,
        userId: string
    ): Promise<TaskCommentResponse<TaskComment>> {
        try {
            // Validates that the task exists and belongs to the group
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                }
            })

            if (!task) {
                throw {
                    success: false,
                    message: TaskCommentCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            // Creates the comment
            const comment = await TaskComment.create({
                task_id: taskId,
                user_id: userId,
                content: commentData.content.trim()
            })

            // Fetches the created comment with user details
            const createdComment = await TaskComment.findByPk(comment.uuid, {
                include: [
                    { model: User, as: 'user', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] }
                ]
            })

            // Logs success
            logger.info('Task comment created successfully', { commentId: comment.uuid, taskId, groupId, userId })

            // Returns success response
            return {
                success: true,
                message: TaskCommentCode.COMMENT_CREATED,
                code: 201,
                comment: createdComment!
            }
        } catch (error) {
            // Logs error
            logger.error('Task comment creation failed', { error, groupId, taskId, commentData, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCommentCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Updates an existing task comment.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task
     * @param commentId - The UUID of the comment to update
     * @param updateData - The data to update
     * @param userId - The UUID of the user performing the update
     * @returns A response containing the updated comment
     * @throws TaskCommentError if the update process fails
     */
    async updateTaskComment(
        groupId: string,
        taskId: string,
        commentId: string,
        updateData: TaskCommentUpdateData,
        userId: string
    ): Promise<TaskCommentResponse<TaskComment>> {
        try {
            // Validates that the task exists and belongs to the group
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                }
            })

            if (!task) {
                throw {
                    success: false,
                    message: TaskCommentCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            // Finds the comment
            const comment = await TaskComment.findOne({
                where: {
                    uuid: commentId,
                    task_id: taskId
                }
            })

            if (!comment) {
                throw {
                    success: false,
                    message: TaskCommentCode.COMMENT_NOT_FOUND,
                    code: 404,
                    stack: new Error('Comment not found for this task')
                }
            }

            // Checks if the user owns the comment or has admin rights
            if (comment.user_id !== userId) {
                throw {
                    success: false,
                    message: TaskCommentCode.PERMISSION_DENIED,
                    code: 403,
                    stack: new Error('You can only edit your own comments')
                }
            }

            // Updates the comment
            await comment.update({
                content: updateData.content.trim()
            })

            // Fetches updated comment with user details
            const updatedComment = await TaskComment.findByPk(comment.uuid, {
                include: [
                    { model: User, as: 'user', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] }
                ]
            })

            // Logs success
            logger.info('Task comment updated successfully', { commentId, taskId, groupId, userId })

            // Returns success response
            return {
                success: true,
                message: TaskCommentCode.COMMENT_UPDATED,
                code: 200,
                comment: updatedComment!
            }
        } catch (error) {
            // Logs error
            logger.error('Task comment update failed', { error, groupId, taskId, commentId, updateData, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCommentCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Deletes a task comment.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task
     * @param commentId - The UUID of the comment to delete
     * @param userId - The UUID of the user performing the deletion
     * @returns A response indicating successful deletion
     * @throws TaskCommentError if the deletion process fails
     */
    async deleteTaskComment(
        groupId: string,
        taskId: string,
        commentId: string,
        userId: string
    ): Promise<TaskCommentResponse<{ uuid: string }>> {
        try {
            // Validates that the task exists and belongs to the group
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                }
            })

            if (!task) {
                throw {
                    success: false,
                    message: TaskCommentCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            // Finds the comment
            const comment = await TaskComment.findOne({
                where: {
                    uuid: commentId,
                    task_id: taskId
                }
            })

            if (!comment) {
                throw {
                    success: false,
                    message: TaskCommentCode.COMMENT_NOT_FOUND,
                    code: 404,
                    stack: new Error('Comment not found for this task')
                }
            }

            // Checks if the user owns the comment or has admin rights
            if (comment.user_id !== userId) {
                throw {
                    success: false,
                    message: TaskCommentCode.PERMISSION_DENIED,
                    code: 403,
                    stack: new Error('You can only delete your own comments')
                }
            }

            // Deletes the comment
            await comment.destroy()

            // Logs success
            logger.info('Task comment deleted successfully', { commentId, taskId, groupId, userId })

            // Returns success response
            return {
                success: true,
                message: TaskCommentCode.COMMENT_DELETED,
                code: 200,
                comment: { uuid: commentId }
            }
        } catch (error) {
            // Logs error
            logger.error('Task comment deletion failed', { error, groupId, taskId, commentId, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCommentCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Adds a time entry to a task.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task
     * @param timeData - The time entry data
     * @param userId - The UUID of the user adding the time entry
     * @returns A response containing the updated task
     * @throws TaskError if the time entry process fails
     */
    async addTimeEntry(
        groupId: string,
        taskId: string,
        timeData: { hours: number; description?: string; date?: Date },
        userId: string
    ): Promise<TaskResponse<Task>> {
        try {
            // Finds the task
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                }
            })

            if (!task) {
                throw {
                    success: false,
                    message: TaskCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            // Gets current metadata
            const currentMetadata = task.metadata || {}
            const currentTimeEntries = currentMetadata.time_entries || []

            // Creates new time entry
            const newTimeEntry = {
                user_id: userId,
                hours: timeData.hours,
                description: timeData.description || '',
                date: timeData.date || new Date()
            }

            // Updates metadata with new time entry
            const updatedMetadata = {
                ...currentMetadata,
                time_entries: [...currentTimeEntries, newTimeEntry],
                actual_hours: (currentMetadata.actual_hours || 0) + timeData.hours
            }

            // Updates the task
            await task.update({ metadata: updatedMetadata })

            // Fetches updated task with associations
            const updatedTask = await Task.findByPk(task.uuid, {
                include: [
                    { model: User, as: 'creator', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: TaskColumn, as: 'column', attributes: ['uuid', 'name', 'color'] },
                    { 
                        model: User, 
                        as: 'assignees', 
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'],
                        through: { attributes: ['assigned_at', 'assigned_by'] }
                    }
                ]
            })

            // Logs success
            logger.info('Time entry added successfully', { taskId, groupId, userId, hours: timeData.hours })

            // Returns success response
            return {
                success: true,
                message: TaskCode.TASK_UPDATED,
                code: 200,
                task: updatedTask! as any
            }
        } catch (error) {
            // Logs error
            logger.error('Time entry addition failed', { error, groupId, taskId, timeData, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Updates custom fields for a task.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task
     * @param customFields - The custom fields to update
     * @param userId - The UUID of the user updating the fields
     * @returns A response containing the updated task
     * @throws TaskError if the update process fails
     */
    async updateCustomFields(
        groupId: string,
        taskId: string,
        customFields: Record<string, any>,
        userId: string
    ): Promise<TaskResponse<Task>> {
        const transaction = await db.transaction()
        
        try {
            // Finds the task
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                },
                transaction
            })

            if (!task) {
                throw {
                    success: false,
                    message: TaskCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            // Process the custom fields
            await this.processTaskCustomFields(taskId, customFields, userId, transaction)

            // Fetches updated task with associations and custom fields
            const updatedTask = await Task.findByPk(task.uuid, {
                include: [
                    { model: User, as: 'creator', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: TaskColumn, as: 'column', attributes: ['uuid', 'name', 'color'] },
                    { 
                        model: User, 
                        as: 'assignees', 
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'],
                        through: { attributes: ['assigned_at', 'assigned_by'] }
                    }
                ],
                transaction
            })

            // Get custom fields for the task
            const taskCustomFields = await TaskCustomField.findAll({
                where: { task_id: taskId },
                include: [
                    {
                        model: GroupCustomFieldDefinition,
                        as: 'fieldDefinition',
                        attributes: ['uuid', 'name', 'type', 'required', 'placeholder', 'description', 'options', 'validation_rules']
                    }
                ],
                order: [['display_order', 'ASC']],
                transaction
            })

            // Add custom fields to task data
            if (updatedTask) {
                (updatedTask as any).custom_fields = taskCustomFields
            }

            await transaction.commit()

            // Logs success
            logger.info('Custom fields updated successfully', { taskId, groupId, userId })

            // Returns success response
            return {
                success: true,
                message: TaskCode.TASK_UPDATED,
                code: 200,
                task: updatedTask! as any
            }
        } catch (error) {
            await transaction.rollback()
            
            // Logs error
            logger.error('Custom fields update failed', { error, groupId, taskId, customFields, userId })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Assigns users to a task.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task
     * @param userIds - Array of user IDs to assign
     * @param assignedBy - The UUID of the user performing the assignment
     * @returns A response containing the updated task
     * @throws TaskError if the assignment process fails
     */
    async assignUsersToTask(
        groupId: string,
        taskId: string,
        userIds: string[],
        assignedBy: string
    ): Promise<TaskResponse<Task>> {
        const transaction = await db.transaction()
        
        try {
            // Validates that the task exists and belongs to the group
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                },
                transaction
            })

            if (!task) {
                throw {
                    success: false,
                    message: TaskCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            // Validates that all users are members of the group (only if userIds is not empty)
            if (userIds.length > 0) {
                const groupMembers = await GroupMembership.findAll({
                    where: {
                        group_id: groupId,
                        user_id: { [Op.in]: userIds },
                        status: 'active'
                    },
                    transaction
                })

                if (groupMembers.length !== userIds.length) {
                    throw {
                        success: false,
                        message: TaskCode.INVALID_ASSIGNEE,
                        code: 400,
                        stack: new Error('One or more users are not members of this group')
                    }
                }
            }

            // Remove existing assignments for this task
            await TaskAssignee.destroy({
                where: { task_id: taskId },
                transaction
            })

            // Create new assignments (only if there are users to assign)
            if (userIds.length > 0) {
                const assignmentData = userIds.map(userId => ({
                    task_id: taskId,
                    user_id: userId,
                    assigned_by: assignedBy
                }))

                await TaskAssignee.bulkCreate(assignmentData, { transaction })
            }

            await transaction.commit()

            // Fetch updated task with assignees
            const updatedTask = await Task.findByPk(task.uuid, {
                include: [
                    { model: User, as: 'creator', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: TaskColumn, as: 'column', attributes: ['uuid', 'name', 'color'] },
                    { 
                        model: User, 
                        as: 'assignees', 
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'],
                        through: { attributes: ['assigned_at', 'assigned_by'] }
                    }
                ]
            })

            // Logs success
            logger.info('Users assigned to task successfully', { taskId, groupId, assignedBy, userIds })

            // Returns success response
            return {
                success: true,
                message: TaskCode.TASK_UPDATED,
                code: 200,
                task: updatedTask! as any
            }
        } catch (error) {
            await transaction.rollback()
            
            // Logs error
            logger.error('Task assignment failed', { error, groupId, taskId, userIds, assignedBy })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Gets group members who can be assigned to tasks with search and pagination.
     * 
     * @param groupId - The UUID of the group
     * @param searchQuery - Optional search query for name or email
     * @param limit - Number of results to return (default: 5)
     * @param offset - Number of results to skip (default: 0)
     * @returns A response containing the group members with pagination info
     * @throws TaskError if the retrieval process fails
     */
    async getGroupMembers(groupId: string, searchQuery?: string, limit: number = 5, offset: number = 0): Promise<{ 
        success: true; 
        members: any[]; 
        totalCount: number;
        hasMore: boolean;
    }> {
        try {
            // Build where clause for search
            const whereClause: any = {
                group_id: groupId,
                status: 'active'
            }

            // Add search conditions if searchQuery is provided
            let userWhereClause: any = {}
            if (searchQuery && searchQuery.trim()) {
                const searchTerm = `%${searchQuery.trim()}%`
                const searchWords = searchQuery.trim().split(/\s+/)
                const trimmedQuery = searchQuery.trim()
                
                // For assignee selection, search in first name, last name, and email
                userWhereClause = {
                    [Op.or]: [
                        { first_name: { [Op.iLike]: searchTerm } },
                        { last_name: { [Op.iLike]: searchTerm } },
                        { email: { [Op.iLike]: searchTerm } }
                    ]
                }
                
                logger.info('Creating search condition', {
                    searchQuery,
                    searchTerm,
                    trimmedQuery,
                    searchWords
                })
                
                logger.info('Created userWhereClause', {
                    userWhereClause: JSON.stringify(userWhereClause),
                    userWhereClauseRaw: userWhereClause,
                    hasUserWhereClause: Object.keys(userWhereClause).length > 0,
                    userWhereClauseKeys: Object.keys(userWhereClause),
                    OpOrValue: userWhereClause[Op.or]
                })
            }

            // Get total count for pagination
            const totalCount = await GroupMembership.count({
                where: whereClause,
                include: [
                    { 
                        model: User, 
                        as: 'user', 
                        where: searchQuery && searchQuery.trim() ? userWhereClause : undefined,
                        attributes: [],
                        required: !!(searchQuery && searchQuery.trim())
                    }
                ]
            })

            // Fetches active group members with search and pagination
            const members = await GroupMembership.findAll({
                where: whereClause,
                include: [
                    { 
                        model: User, 
                        as: 'user', 
                        where: searchQuery && searchQuery.trim() ? userWhereClause : undefined,
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url', 'email'],
                        required: !!(searchQuery && searchQuery.trim())
                    }
                ],
                limit,
                offset,
                order: [['created_at', 'ASC']] // Consistent ordering
            })

            const hasMore = offset + members.length < (totalCount as number)

            // Logs success with search details
            logger.info('Group members retrieved successfully', { 
                groupId, 
                memberCount: members.length, 
                totalCount, 
                searchQuery,
                searchWords: searchQuery ? searchQuery.trim().split(/\s+/) : [],
                isEmailDomainSearch: searchQuery ? /[@.]/.test(searchQuery.trim()) || 
                    /\.(com|org|net|edu|gov|co|io|me|us|uk|ca|au|de|fr|jp|in)$/i.test(searchQuery.trim()) : false,
                userWhereClause: searchQuery ? JSON.stringify(userWhereClause) : 'none',
                hasUserWhereClause: Object.keys(userWhereClause).length > 0,
                limit,
                offset,
                hasMore,
                memberEmails: members.map(m => (m as any).email),
                memberNames: members.map(m => `${(m as any).first_name} ${(m as any).last_name}`)
            })

            // Returns success response
            return {
                success: true,
                members: members.map(member => (member as any).user),
                totalCount: totalCount as number,
                hasMore
            }
        } catch (error) {
            // Logs error
            logger.error('Group members retrieval failed', { error, groupId, searchQuery, limit, offset })

            // Throws formatted error
            throw {
                success: false,
                message: TaskCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Updates a time entry in a task.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task
     * @param timeEntryIndex - The index of the time entry to update
     * @param timeData - The updated time entry data
     * @param userId - The UUID of the user updating the time entry
     * @returns A response containing the updated task
     * @throws TaskError if the time entry update process fails
     */
    async updateTimeEntry(
        groupId: string,
        taskId: string,
        timeEntryIndex: number,
        timeData: { hours: number; description?: string; date?: Date },
        userId: string
    ): Promise<TaskResponse<Task>> {
        try {
            // Finds the task
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                }
            })

            if (!task) {
                throw {
                    success: false,
                    message: TaskCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            // Gets current metadata
            const currentMetadata = task.metadata || {}
            const currentTimeEntries = currentMetadata.time_entries || []

            // Validates time entry index
            if (timeEntryIndex < 0 || timeEntryIndex >= currentTimeEntries.length) {
                throw {
                    success: false,
                    message: 'Time entry not found',
                    code: 404,
                    stack: new Error('Time entry index out of bounds')
                }
            }

            // Gets the old time entry to calculate the difference
            const oldTimeEntry = currentTimeEntries[timeEntryIndex]
            const hoursDifference = timeData.hours - oldTimeEntry.hours

            // Updates the time entry
            const updatedTimeEntries = [...currentTimeEntries]
            updatedTimeEntries[timeEntryIndex] = {
                user_id: userId,
                hours: timeData.hours,
                description: timeData.description || '',
                date: timeData.date || new Date()
            }

            // Updates metadata with updated time entry
            const updatedMetadata = {
                ...currentMetadata,
                time_entries: updatedTimeEntries,
                actual_hours: (currentMetadata.actual_hours || 0) + hoursDifference
            }

            // Updates the task
            await task.update({ metadata: updatedMetadata })

            // Fetches updated task with associations
            const updatedTask = await Task.findByPk(task.uuid, {
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url']
                    },
                    {
                        model: User,
                        as: 'assignees',
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'],
                        through: {
                            attributes: ['assigned_at', 'assigned_by']
                        }
                    }
                ]
            })

            if (!updatedTask) {
                throw {
                    success: false,
                    message: 'Failed to fetch updated task',
                    code: 500,
                    stack: new Error('Task not found after update')
                }
            }

            return {
                success: true,
                message: TaskCode.TASK_UPDATED,
                code: 200,
                task: updatedTask as Task
            }
        } catch (error: any) {
            logger.error('Error updating time entry:', error)
            throw {
                success: false,
                message: error.message || 'Failed to update time entry',
                code: error.code || 500,
                stack: error.stack
            }
        }
    }

    /**
     * Deletes a time entry from a task.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task
     * @param timeEntryIndex - The index of the time entry to delete
     * @param userId - The UUID of the user deleting the time entry
     * @returns A response containing the updated task
     * @throws TaskError if the time entry deletion process fails
     */
    async deleteTimeEntry(
        groupId: string,
        taskId: string,
        timeEntryIndex: number,
        userId: string
    ): Promise<TaskResponse<Task>> {
        try {
            // Finds the task
            const task = await Task.findOne({
                where: {
                    uuid: taskId,
                    group_id: groupId
                }
            })

            if (!task) {
                throw {
                    success: false,
                    message: TaskCode.TASK_NOT_FOUND,
                    code: 404,
                    stack: new Error('Task not found in this group')
                }
            }

            // Gets current metadata
            const currentMetadata = task.metadata || {}
            const currentTimeEntries = currentMetadata.time_entries || []

            // Validates time entry index
            if (timeEntryIndex < 0 || timeEntryIndex >= currentTimeEntries.length) {
                throw {
                    success: false,
                    message: 'Time entry not found',
                    code: 404,
                    stack: new Error('Time entry index out of bounds')
                }
            }

            // Gets the time entry to be deleted to calculate the hours to subtract
            const timeEntryToDelete = currentTimeEntries[timeEntryIndex]

            // Removes the time entry
            const updatedTimeEntries = currentTimeEntries.filter((_, index) => index !== timeEntryIndex)

            // Updates metadata with removed time entry
            const updatedMetadata = {
                ...currentMetadata,
                time_entries: updatedTimeEntries,
                actual_hours: Math.max(0, (currentMetadata.actual_hours || 0) - timeEntryToDelete.hours)
            }

            // Updates the task
            await task.update({ metadata: updatedMetadata })

            // Fetches updated task with associations
            const updatedTask = await Task.findByPk(task.uuid, {
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url']
                    },
                    {
                        model: User,
                        as: 'assignees',
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'],
                        through: {
                            attributes: ['assigned_at', 'assigned_by']
                        }
                    }
                ]
            })

            if (!updatedTask) {
                throw {
                    success: false,
                    message: 'Failed to fetch updated task',
                    code: 500,
                    stack: new Error('Task not found after update')
                }
            }

            return {
                success: true,
                message: TaskCode.TASK_DELETED,
                code: 200,
                task: updatedTask as Task
            }
        } catch (error: any) {
            logger.error('Error deleting time entry:', error)
            throw {
                success: false,
                message: error.message || 'Failed to delete time entry',
                code: error.code || 500,
                stack: error.stack
            }
        }
    }

    /**
     * Validates and standardizes custom fields against group definitions
     * 
     * @param customFields - The custom field values from the request
     * @param fieldDefinitions - The custom field definitions from the group
     * @param transaction - Database transaction
     * @returns Validated and standardized custom fields
     */
    private async validateAndStandardizeCustomFields(
        customFields: Record<string, string>,
        fieldDefinitions: any[],
        transaction: any
    ): Promise<Record<string, string>> {
        const validatedFields: Record<string, string> = {}

        // Process each field definition
        for (const fieldDef of fieldDefinitions) {
            const fieldId = fieldDef.id
            const fieldName = fieldDef.name
            const fieldType = fieldDef.type
            const isRequired = fieldDef.required
            const options = fieldDef.options || []

            // Check if field value is provided
            const fieldValue = customFields[fieldId] || customFields[fieldName] || ''

            // Validate required fields
            if (isRequired && !fieldValue.trim()) {
                throw {
                    success: false,
                    message: `Custom field '${fieldName}' is required`,
                    code: 400,
                    stack: new Error(`Required custom field '${fieldName}' is missing`)
                }
            }

            // Validate field type
            if (fieldValue.trim()) {
                switch (fieldType) {
                    case 'number':
                        if (isNaN(Number(fieldValue))) {
                            throw {
                                success: false,
                                message: `Custom field '${fieldName}' must be a valid number`,
                                code: 400,
                                stack: new Error(`Invalid number format for field '${fieldName}'`)
                            }
                        }
                        break
                    
                    case 'dropdown':
                        if (!options.includes(fieldValue)) {
                            throw {
                                success: false,
                                message: `Custom field '${fieldName}' must be one of: ${options.join(', ')}`,
                                code: 400,
                                stack: new Error(`Invalid option for dropdown field '${fieldName}'`)
                            }
                        }
                        break
                    
                    case 'text':
                    default:
                        // Text fields don't need special validation
                        break
                }
            }

            // Store the validated field with standardized field ID
            if (fieldValue.trim()) {
                validatedFields[fieldId] = fieldValue.trim()
            }
        }

        // Check for unknown fields (fields not defined in group settings)
        const definedFieldIds = fieldDefinitions.map(f => f.id)
        const definedFieldNames = fieldDefinitions.map(f => f.name)
        
        for (const [key, value] of Object.entries(customFields)) {
            if (value.trim() && 
                !definedFieldIds.includes(key) && 
                !definedFieldNames.includes(key)) {
                logger.warn(`Unknown custom field '${key}' provided, ignoring`, {
                    fieldId: key,
                    fieldValue: value,
                    definedFields: definedFieldIds
                })
            }
        }

        return validatedFields
    }

    /**
     * Inherits group custom field templates and creates task instances
     * 
     * @param taskId - The UUID of the task
     * @param groupId - The UUID of the group
     * @param userId - The UUID of the user creating the task
     * @param transaction - Database transaction
     */
    private async inheritGroupCustomFieldTemplates(
        taskId: string,
        groupId: string,
        userId: string,
        transaction: any
    ): Promise<void> {
        try {
            // Get all active group custom field definitions
            const groupFieldDefinitions = await GroupCustomFieldDefinition.findAll({
                where: {
                    group_id: groupId,
                    is_active: true
                },
                order: [['display_order', 'ASC']],
                transaction
            })

            // Create task custom field instances for each group template
            for (const fieldDef of groupFieldDefinitions) {
                await TaskCustomField.create({
                    task_id: taskId,
                    field_definition_id: fieldDef.uuid,
                    field_name: fieldDef.name,
                    field_value: '', // Empty value initially
                    field_type: fieldDef.type,
                    is_group_field: true,
                    display_order: fieldDef.display_order,
                    created_by: userId
                }, { transaction })
            }

            logger.info('Group custom field templates inherited for task', {
                taskId,
                groupId,
                userId,
                inheritedFields: groupFieldDefinitions.length
            })
        } catch (error) {
            logger.error('Error inheriting group custom field templates:', error)
            throw error
        }
    }

    /**
     * Processes custom fields provided in task data
     * 
     * @param taskId - The UUID of the task
     * @param customFields - The custom field values
     * @param userId - The UUID of the user
     * @param transaction - Database transaction
     */
    private async processTaskCustomFields(
        taskId: string,
        customFields: Record<string, any>,
        userId: string,
        transaction: any
    ): Promise<void> {
        try {
            for (const [fieldId, fieldValue] of Object.entries(customFields)) {
                if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
                    // Check if this is a group field (has field_definition_id)
                    const existingGroupField = await TaskCustomField.findOne({
                        where: {
                            task_id: taskId,
                            field_definition_id: fieldId,
                            is_group_field: true
                        },
                        transaction
                    })

                    if (existingGroupField) {
                        // Update existing group field
                        await existingGroupField.update({
                            field_value: String(fieldValue)
                        }, { transaction })
                    } else {
                        // This is a task-specific custom field
                        // Get the next display order for task-specific fields
                        const maxOrder = await TaskCustomField.max('display_order', {
                            where: { 
                                task_id: taskId,
                                is_group_field: false
                            },
                            transaction
                        }) as number || 0

                        await TaskCustomField.create({
                            task_id: taskId,
                            field_name: fieldId, // Using fieldId as field_name for task-specific fields
                            field_value: String(fieldValue),
                            field_type: 'text', // Default type for task-specific fields
                            is_group_field: false,
                            display_order: maxOrder + 1,
                            created_by: userId
                        }, { transaction })
                    }
                }
            }

            logger.info('Task custom fields processed', {
                taskId,
                userId,
                processedFields: Object.keys(customFields).length
            })
        } catch (error) {
            logger.error('Error processing task custom fields:', error)
            throw error
        }
    }
}

// Export a singleton instance of the TaskService
export default new TaskService() 