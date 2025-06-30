/**
 * Enum containing all task-related response codes.
 * These codes are used for consistent messaging across the task management system.
 */
export enum TaskCode {
    // Success codes
    TASK_CREATED = 'Task created successfully',
    TASK_FOUND = 'Task retrieved successfully',
    TASKS_FOUND = 'Tasks retrieved successfully',
    TASK_UPDATED = 'Task updated successfully',
    TASK_DELETED = 'Task deleted successfully',
    TASK_MOVED = 'Task moved successfully',
    TASK_ASSIGNED = 'Task assigned successfully',
    TASK_COMPLETED = 'Task marked as completed',
    TASK_REOPENED = 'Task reopened successfully',
    
    // Column codes
    COLUMN_CREATED = 'Column created successfully',
    COLUMN_FOUND = 'Column retrieved successfully',
    COLUMNS_FOUND = 'Columns retrieved successfully',
    COLUMN_UPDATED = 'Column updated successfully',
    COLUMN_DELETED = 'Column deleted successfully',
    COLUMN_REORDERED = 'Columns reordered successfully',
    
    // Error codes
    TASK_NOT_FOUND = 'Task not found',
    COLUMN_NOT_FOUND = 'Column not found',
    INVALID_TASK_DATA = 'Invalid task data provided',
    INVALID_COLUMN_DATA = 'Invalid column data provided',
    TASK_TITLE_REQUIRED = 'Task title is required',
    COLUMN_NAME_REQUIRED = 'Column name is required',
    INVALID_STATUS = 'Invalid task status',
    INVALID_PRIORITY = 'Invalid task priority',
    INVALID_COLOR_FORMAT = 'Invalid color format. Use hex color code',
    CANNOT_DELETE_DEFAULT_COLUMN = 'Cannot delete default column',
    COLUMN_HAS_TASKS = 'Cannot delete column with tasks. Move or delete tasks first',
    INVALID_POSITION = 'Invalid position value',
    INVALID_DUE_DATE = 'Invalid due date',
    PERMISSION_DENIED = 'Permission denied to perform this action',
    
    // Database errors
    DATABASE_ERROR = 'Database operation failed',
    TRANSACTION_ERROR = 'Transaction failed'
} 