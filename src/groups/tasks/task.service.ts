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
                status: taskData.status || 'todo'
            }, { transaction })

            // Fetches the created task with associations
            const createdTask = await Task.findByPk(task.uuid, {
                include: [
                    { model: User, as: 'creator', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: User, as: 'assignee', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
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
                        { model: User, as: 'assignee', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] }
                    ]
                }],
                order: [
                    ['position', 'ASC'],
                    [{ model: Task, as: 'tasks' }, 'position', 'ASC']
                ]
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
     * Retrieves a single task by its UUID.
     * 
     * @param groupId - The UUID of the group
     * @param taskId - The UUID of the task
     * @returns A response containing the requested task
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
                    { model: User, as: 'assignee', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: TaskColumn, as: 'column', attributes: ['uuid', 'name', 'color'] }
                ]
            })

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
                task
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
                    { model: User, as: 'assignee', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: TaskColumn, as: 'column', attributes: ['uuid', 'name', 'color'] }
                ]
            })

            // Logs success
            logger.info('Task updated successfully', { taskId, groupId, userId })

            // Returns success response
            return {
                success: true,
                message: TaskCode.TASK_UPDATED,
                code: 200,
                task: updatedTask!
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

            // Updates the task
            await task.update({
                column_id: moveData.column_id,
                position: moveData.position
            }, { transaction })

            await transaction.commit()

            // Fetches updated task with associations
            const movedTask = await Task.findByPk(task.uuid, {
                include: [
                    { model: User, as: 'creator', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: User, as: 'assignee', attributes: ['uuid', 'first_name', 'last_name', 'avatar_url'] },
                    { model: TaskColumn, as: 'column', attributes: ['uuid', 'name', 'color'] }
                ]
            })

            // Logs success
            logger.info('Task moved successfully', { taskId, groupId, moveData, userId })

            // Returns success response
            return {
                success: true,
                message: TaskCode.TASK_MOVED,
                code: 200,
                task: movedTask!
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
}

// Export a singleton instance of the TaskService
export default new TaskService() 