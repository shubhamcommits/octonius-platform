/**
 * Enum containing all task comment-related response codes.
 * These codes are used for consistent messaging across the task comment system.
 */
export enum TaskCommentCode {
    // Success codes
    COMMENT_CREATED = 'Comment created successfully',
    COMMENT_FOUND = 'Comment retrieved successfully',
    COMMENTS_FOUND = 'Comments retrieved successfully',
    COMMENT_UPDATED = 'Comment updated successfully',
    COMMENT_DELETED = 'Comment deleted successfully',
    
    // Error codes
    COMMENT_NOT_FOUND = 'Comment not found',
    COMMENT_CONTENT_REQUIRED = 'Comment content is required',
    COMMENT_TOO_LONG = 'Comment content exceeds maximum length',
    INVALID_COMMENT_DATA = 'Invalid comment data provided',
    PERMISSION_DENIED = 'Permission denied to perform this action',
    TASK_NOT_FOUND = 'Task not found',
    
    // Database errors
    DATABASE_ERROR = 'Database operation failed',
    TRANSACTION_ERROR = 'Transaction failed'
} 