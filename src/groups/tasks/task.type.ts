// Import Codes
import { TaskCode } from './task.code'

/**
 * Interface for successful task responses
 */
export interface TaskResponse<T> {
    success: true
    message: TaskCode
    code: number
    task: T
}

/**
 * Interface for successful tasks list responses
 */
export interface TasksResponse<T> {
    success: true
    message: TaskCode
    code: number
    tasks: T
}

/**
 * Interface for successful column responses
 */
export interface ColumnResponse<T> {
    success: true
    message: TaskCode
    code: number
    column: T
}

/**
 * Interface for successful columns list responses
 */
export interface ColumnsResponse<T> {
    success: true
    message: TaskCode
    code: number
    columns: T
}

/**
 * Interface for successful board responses
 */
export interface BoardResponse<T> {
    success: true
    message: TaskCode
    code: number
    board: T
}

/**
 * Interface for error responses
 */
export interface TaskError {
    success: false
    message: TaskCode
    code: number
    stack: Error
}

/**
 * Interface for task creation data
 */
export interface TaskCreationData {
    title: string
    description?: string
    column_id: string
    status?: 'todo' | 'in_progress' | 'review' | 'done'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    color?: string
    due_date?: Date
    start_date?: Date
    labels?: Array<{
        text: string
        color: string
    }>
    custom_fields?: Record<string, string>
    metadata?: {
        estimated_hours?: number
        time_entries?: Array<{
            user_id: string
            hours: number
            description?: string
            date: Date
        }>
    }
}

/**
 * Interface for task update data
 */
export interface TaskUpdateData {
    title?: string
    description?: string
    status?: 'todo' | 'in_progress' | 'review' | 'done'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    color?: string
    due_date?: Date | null
    start_date?: Date | null
    completed_at?: Date | null
    completed_by?: string | null
    labels?: Array<{
        text: string
        color: string
    }>
    metadata?: {
        estimated_hours?: number
        actual_hours?: number
        time_entries?: Array<{
            user_id: string
            hours: number
            description?: string
            date: Date
        }>
        custom_fields?: Record<string, string>
    }
}

/**
 * Interface for task move data
 */
export interface TaskMoveData {
    column_id: string
    position: number
}

/**
 * Interface for column creation data
 */
export interface ColumnCreationData {
    name: string
    color?: string
    position?: number
}

/**
 * Interface for column update data
 */
export interface ColumnUpdateData {
    name?: string
    color?: string
    position?: number
} 