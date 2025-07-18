/**
 * Interface for successful workplace response
 */
export interface WorkplaceResponse<T> {
    success: true
    message: string
    code: number
    workplace: T
}

/**
 * Interface for successful workplaces response
 */
export interface WorkplacesResponse<T> {
    success: true
    message: string
    code: number
    workplaces: T
}

/**
 * Interface for workplace error response
 */
export interface WorkplaceError {
    success: false
    message: string
    code: number
    stack: Error
} 

/**
 * Interface for successful workplace members response
 */
export interface WorkplaceMembersResponse<T> {
    success: true
    message: string
    code: number
    members: T
}