/**
 * Interface for task comment data
 */
export interface TaskComment {
    uuid: string
    task_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
    user?: {
        uuid: string
        first_name: string
        last_name: string
        avatar_url?: string
    }
}

/**
 * Interface for creating task comments
 */
export interface TaskCommentCreateData {
    content: string
}

/**
 * Interface for updating task comments
 */
export interface TaskCommentUpdateData {
    content: string
}

/**
 * Interface for task comment responses
 */
export interface TaskCommentResponse<T> {
    success: boolean
    message: string
    code: number
    comment?: T
}

/**
 * Interface for multiple task comments responses
 */
export interface TaskCommentsResponse<T> {
    success: boolean
    message: string
    code: number
    comments?: T[]
}

/**
 * Interface for task comment errors
 */
export interface TaskCommentError {
    success: false
    message: string
    code: number
    stack: Error
} 