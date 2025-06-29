// Import Codes
import { GroupCode } from './group.code'

/**
 * Interface for successful responses
 */
export interface GroupResponse<T> {
    success: true
    message: GroupCode
    code: number
    group: T
}

/**
 * Interface for successful responses
 */
export interface GroupsResponse<T> {
    success: true
    message: GroupCode
    code: number
    groups: T
}

/**
 * Interface for error responses
 */
export interface GroupError {
    success: false
    message: GroupCode
    code: number
    stack: Error
}

/**
 * Interface for group member responses
 */
export interface GroupMemberResponse<T> {
    success: true
    message: GroupCode
    code: number
    member: T
}

/**
 * Interface for group members responses
 */
export interface GroupMembersResponse<T> {
    success: true
    message: GroupCode
    code: number
    members: T
} 