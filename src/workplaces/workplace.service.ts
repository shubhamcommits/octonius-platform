// Import Models
import Workplace from './workplace.model'
import WorkplaceMembership from './workplace-membership.model'
import User from '../users/user.model'
import Role from '../roles/role.model'

// Import Logger
import logger from '../logger'

// Import Workplace Codes
import { WorkplaceCode } from './workplace.code'

// Import Workplace Types
import { WorkplaceResponse, WorkplacesResponse, WorkplaceError } from './workplace.type'

export class WorkplaceService {
    /**
     * Gets all workplaces for a user
     * @param user_id - The UUID of the user
     * @returns Array of workplaces the user is a member of
     */
    async getUserWorkplaces(user_id: string): Promise<WorkplacesResponse<Workplace[]> | WorkplaceError> {
        try {
            // Find all workplace memberships for the user with active status
            const memberships = await WorkplaceMembership.findAll({
                where: { 
                    user_id,
                    status: 'active'
                },
                include: [{
                    model: Workplace,
                    as: 'workplace',
                    where: {
                        active: true
                    },
                    required: true
                }, {
                    model: Role,
                    as: 'role',
                    required: true
                }]
            })

            // Extract unique workplaces from memberships
            const workplaces = memberships.map(membership => membership.get('workplace') as Workplace)
                .filter((workplace, index, self) => 
                    index === self.findIndex(w => w.uuid === workplace.uuid)
                )

            // Log success
            logger.info('User workplaces retrieved successfully', { user_id, count: workplaces.length })

            // Return success response
            return {
                success: true,
                message: WorkplaceCode.USER_WORKPLACES_FOUND,
                code: 200,
                workplaces
            }
        } catch (error) {
            // Log error
            logger.error('Failed to get user workplaces', { error, user_id })

            // Return error response
            return {
                success: false,
                message: WorkplaceCode.DATABASE_ERROR,
                code: 500,
                stack: error instanceof Error ? error : new Error('Database error')
            }
        }
    }

    /**
     * Gets all users in a workplace
     * @param workplace_id - The UUID of the workplace
     * @returns Array of users who are members of the workplace
     */
    async getWorkplaceUsers(workplace_id: string): Promise<WorkplacesResponse<User[]> | WorkplaceError> {
        try {
            // Method 1: Using WorkplaceMembership (recommended - gives you more control)
            const memberships = await WorkplaceMembership.findAll({
                where: { 
                    workplace_id,
                    status: 'active'
                },
                include: [{
                    model: User,
                    as: 'user',
                    where: {
                        active: true
                    },
                    required: true
                }, {
                    model: Role,
                    as: 'role',
                    required: true
                }]
            })

            // Extract users with their roles
            const users = memberships.map(membership => {
                const user = membership.get('user') as User
                const role = membership.get('role') as Role
                // You can add role info to user object if needed
                return {
                    ...user.toJSON(),
                    role: role.toJSON(),
                    membership_status: membership.status,
                    joined_at: membership.joined_at
                }
            })

            // Log success
            logger.info('Workplace users retrieved successfully', { workplace_id, count: users.length })

            // Return success response
            return {
                success: true,
                message: WorkplaceCode.WORKPLACES_FOUND,
                code: 200,
                workplaces: users as any
            }
        } catch (error) {
            // Log error
            logger.error('Failed to get workplace users', { error, workplace_id })

            // Return error response
            return {
                success: false,
                message: WorkplaceCode.DATABASE_ERROR,
                code: 500,
                stack: error instanceof Error ? error : new Error('Database error')
            }
        }
    }

    /**
     * Alternative: Gets all users in a workplace using the belongsToMany association
     * @param workplace_id - The UUID of the workplace
     * @returns Array of users who are members of the workplace
     */
    async getWorkplaceUsersViaAssociation(workplace_id: string): Promise<WorkplacesResponse<User[]> | WorkplaceError> {
        try {
            // Method 2: Using the belongsToMany association
            const workplace = await Workplace.findByPk(workplace_id, {
                include: [{
                    model: User,
                    as: 'users',
                    through: {
                        where: { status: 'active' },
                        attributes: ['status', 'joined_at', 'role_id']
                    },
                    where: { active: true }
                }]
            })

            if (!workplace) {
                return {
                    success: false,
                    message: WorkplaceCode.WORKPLACE_NOT_FOUND,
                    code: 404,
                    stack: new Error('Workplace not found')
                }
            }

            const users = workplace.get('users') as User[]

            // Log success
            logger.info('Workplace users retrieved successfully via association', { workplace_id, count: users.length })

            // Return success response
            return {
                success: true,
                message: WorkplaceCode.WORKPLACES_FOUND,
                code: 200,
                workplaces: users as any
            }
        } catch (error) {
            // Log error
            logger.error('Failed to get workplace users via association', { error, workplace_id })

            // Return error response
            return {
                success: false,
                message: WorkplaceCode.DATABASE_ERROR,
                code: 500,
                stack: error instanceof Error ? error : new Error('Database error')
            }
        }
    }
} 