// Sequelize Module
import { Op } from 'sequelize'

// Import Models
import User from './user.model'
import Workplace from '../workplaces/workplace.model'
import WorkplaceMembership from '../workplaces/workplace-membership.model'
import Role from '../roles/role.model'

// Import Logger
import logger from '../logger'

// Import User Codes
import { UserCode } from './user.code'

// Import User Types
import { UserResponse, UsersResponse } from './user.type'

// Import Private Group Service
import { PrivateGroupService } from '../groups/private-group.service'

// Import Cache Service
import { CacheService } from '../shared/cache.service'

/**
 * Interface defining the required and optional fields when creating a new user.
 * This ensures type safety and helps with code completion in the IDE.
 * Note: This is a passwordless authentication system using OTP.
 */
interface UserCreationData {
    email: string
    first_name?: string | null
    last_name?: string | null
    role_id?: string | null // Can be set later
    phone?: string | null
    timezone: string
    language: string
    notification_preferences: {
        email: boolean
        push: boolean
        in_app: boolean
    }
    source: string
    active?: boolean
}

/**
 * Service class for handling all user-related operations.
 * This includes CRUD operations, workplace management, and user queries.
 */
export class UserService {
    private privateGroupService = new PrivateGroupService();

    /**
     * Creates a new user account in the system.
     * 
     * @param userData - The user account data to be created
     * @returns A response containing the newly created user account
     * @throws UserError if the account creation process fails
     */
    async create(userData: UserCreationData): Promise<UserResponse<User>> {
        try {
            // Creates user in database
            const user = await User.create({
                ...userData,
                active: userData.active ?? true
            })

            // Cache the new user
            await CacheService.setUserProfile(user.uuid, user)
            logger.info('New user cached successfully', { userId: user.uuid })

            // Logs success
            logger.info('User account creation successful', { userId: user.uuid })

            // Auto-create private group for the user if they have a workplace
            if ((userData as any).current_workplace_id) {
                try {
                    const userName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email || 'User';
                    await this.privateGroupService.createPrivateGroupForUser(
                        user.uuid, 
                        (userData as any).current_workplace_id, 
                        userName
                    );
                    logger.info('Private group created for new user', { userId: user.uuid });
                } catch (groupError) {
                    logger.warn('Failed to create private group for new user', { 
                        userId: user.uuid, 
                        error: groupError 
                    });
                    // Don't fail user creation if private group fails
                }
            }

            // Returns success response
            return {
                success: true,
                message: UserCode.USER_CREATED,
                code: 201,
                user: user
            }
        } catch (error) {
            // Logs error
            logger.error('User account creation failed', { error, userData })

            // Throws formatted error
            throw {
                success: false,
                message: UserCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Retrieves a user account by its unique identifier.
     * 
     * @param uuid - The unique identifier of the user account
     * @param include - Optional array of related models to include in the query
     * @returns A response containing the requested user account
     * @throws UserError if the account retrieval process fails
     */
    async getById(uuid: string, include: string[] = []): Promise<UserResponse<User>> {
        try {
            // Check cache first (only for simple queries without includes)
            if (include.length === 0) {
                const cachedUser = await CacheService.getUserProfile(uuid)
                if (cachedUser) {
                    logger.info('User retrieved from cache', { userId: uuid })
                    return {
                        success: true,
                        message: UserCode.USER_FOUND,
                        code: 200,
                        user: cachedUser
                    }
                }
            }

            // Queries the database for a user with the specified UUID
            const user = await User.findByPk(uuid, {
                include: this.getIncludeOptions(include)
            })

            // Checks if user exists
            if (!user) {
                throw {
                    success: false,
                    message: UserCode.USER_NOT_FOUND,
                    code: 404,
                    stack: new Error('User account not found in the database')
                }
            }

            // Cache the result (only for simple queries without includes)
            if (include.length === 0) {
                await CacheService.setUserProfile(uuid, user)
                logger.info('User cached successfully', { userId: uuid })
            }

            // Returns success response
            return {
                success: true,
                message: UserCode.USER_FOUND,
                code: 200,
                user: user
            }
        } catch (error) {
            // Logs error
            logger.error('User account retrieval failed', { error, uuid })

            // Throws formatted error
            throw {
                success: false,
                message: UserCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Retrieves a user account by their email address.
     * 
     * @param email - The email address associated with the user account
     * @param include - Optional array of related models to include in the query
     * @returns A response containing the requested user account
     * @throws UserError if the account retrieval process fails
     */
    async getByEmail(email: string, include: string[] = []): Promise<UserResponse<User>> {

        // Searches for a user with the specified email address
        const user = await User.findOne({
            where: { email },
            include: this.getIncludeOptions(include)
        })

        // Checks if user exists
        if (!user) {
            throw {
                success: false,
                message: UserCode.USER_NOT_FOUND,
                code: 404,
                stack: new Error(UserCode.USER_NOT_FOUND)
            }
        }

        // Returns success response
        return {
            success: true,
            message: UserCode.USER_FOUND,
            code: 200,
            user: user
        }
    }

    /**
     * Retrieves a paginated list of user accounts with optional search and filtering.
     * 
     * @param options - Query options including pagination, search, and filters
     * @returns A response containing the list of user accounts and total count
     * @throws UserError if the account retrieval process fails
     */
    async getAll(options: {
        page?: number
        limit?: number
        search?: string
        include?: string[]
        filters?: Record<string, any>
    } = {}): Promise<UsersResponse<{ users: User[]; total: number }>> {
        try {
            // Destructures and sets default values for query options
            const { page = 1, limit = 10, search, include = [], filters = {} } = options

            // Initializes the where clause with any provided filters
            const where: any = { ...filters }

            // Adds search conditions if a search term is provided
            if (search) {
                where[Op.or] = [
                    { first_name: { [Op.iLike]: `%${search}%` } },
                    { last_name: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } }
                ]
            }

            // Performs the paginated query with search and filter conditions
            const { rows: users, count: total } = await User.findAndCountAll({
                where,
                include: this.getIncludeOptions(include),
                limit,
                offset: (page - 1) * limit,
                order: [['created_at', 'DESC']]
            })

            // Returns success response
            return {
                success: true,
                message: UserCode.USERS_FOUND,
                code: 200,
                users: { users, total }
            }
        } catch (error) {
            // Logs error
            logger.error('User accounts retrieval failed', { error, options })

            // Throws formatted error
            throw {
                success: false,
                message: UserCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Updates an existing user account's information.
     * 
     * @param uuid - The unique identifier of the user account to update
     * @param userData - The data to update in the user account
     * @returns A response containing the updated user account
     * @throws UserError if the account update process fails
     */
    async update(uuid: string, userData: Partial<User>): Promise<UserResponse<User>> {
        try {
            // Attempts to find the user by UUID
            const user = await User.findByPk(uuid)

            // Checks if user exists
            if (!user) {
                throw {
                    success: false,
                    message: UserCode.USER_NOT_FOUND,
                    code: 404,
                    stack: new Error('User account not found in the database')
                }
            }

            // Updates the user record with the provided data
            await user.update(userData)

            // Invalidate user-related cache
            await CacheService.invalidateUserData(uuid)
            logger.info('User cache invalidated after update', { userId: uuid })

            // Logs success
            logger.info('User account update successful', { userId: user.uuid })

            // Returns success response
            return {
                success: true,
                message: UserCode.USER_UPDATED,
                code: 200,
                user: user
            }
        } catch (error) {
            // Logs error
            logger.error('User account update failed', { error, uuid, userData })

            // Throws formatted error
            throw {
                success: false,
                message: UserCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Deletes a user account from the system.
     * 
     * @param uuid - The unique identifier of the user account to delete
     * @returns A response indicating the successful deletion
     * @throws UserError if the account deletion process fails
     */
    async delete(uuid: string): Promise<UserResponse<{ uuid: string }>> {
        try {
            // Attempts to find the user by UUID
            const user = await User.findByPk(uuid)

            // Checks if user exists
            if (!user) {
                throw {
                    success: false,
                    message: UserCode.USER_NOT_FOUND,
                    code: 404,
                    stack: new Error('User account not found in the database')
                }
            }

            // Permanently deletes the user record
            await user.destroy()

            // Invalidate user-related cache
            await CacheService.invalidateUserData(uuid)
            logger.info('User cache invalidated after deletion', { userId: uuid })

            // Logs success
            logger.info('User account deletion successful', { userId: uuid })

            // Returns success response
            return {
                success: true,
                message: UserCode.USER_DELETED,
                code: 200,
                user: { uuid }
            }
        } catch (error) {
            // Logs error
            logger.error('User account deletion failed', { error, uuid })

            // Throws formatted error
            throw {
                success: false,
                message: UserCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Adds a user account to a workplace with a specific role.
     * 
     * @param userId - The unique identifier of the user account
     * @param workplaceId - The unique identifier of the workplace
     * @param roleId - The unique identifier of the role
     * @returns A response containing the created workplace membership
     * @throws UserError if the membership creation process fails
     */
    async addToWorkplace(
        userId: string,
        workplaceId: string,
        roleId: string
    ): Promise<UsersResponse<WorkplaceMembership>> {
        try {
            // Creates a new workplace membership record
            const membership = await WorkplaceMembership.create({
                user_id: userId,
                workplace_id: workplaceId,
                role_id: roleId,
                status: 'active',
                joined_at: new Date()
            })

            // Logs success
            logger.info('User workplace membership creation successful', { userId, workplaceId, roleId })

            // Returns success response
            return {
                success: true,
                message: UserCode.USER_ADDED_TO_WORKPLACE,
                code: 201,
                users: membership
            }
        } catch (error) {
            // Logs error
            logger.error('User workplace membership creation failed', { error, userId, workplaceId, roleId })

            // Throws formatted error
            throw {
                success: false,
                message: UserCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Removes a user account from a workplace.
     * 
     * @param userId - The unique identifier of the user account
     * @param workplaceId - The unique identifier of the workplace
     * @returns A response indicating the successful removal
     * @throws UserError if the membership removal process fails
     */
    async removeFromWorkplace(
        userId: string,
        workplaceId: string
    ): Promise<UserResponse<{ userId: string; workplaceId: string }>> {
        try {
            // Searches for the existing workplace membership
            const membership = await WorkplaceMembership.findOne({
                where: {
                    user_id: userId,
                    workplace_id: workplaceId
                }
            })

            // Checks if membership exists
            if (!membership) {
                throw {
                    success: false,
                    message: UserCode.USER_NOT_IN_WORKPLACE,
                    code: 404,
                    stack: new Error('User is not a member of this workplace')
                }
            }

            // Permanently deletes the membership record
            await membership.destroy()

            // Logs success
            logger.info('User workplace membership removal successful', { userId, workplaceId })

            // Returns success response
            return {
                success: true,
                message: UserCode.USER_REMOVED_FROM_WORKPLACE,
                code: 200,
                user: { userId, workplaceId }
            }
        } catch (error) {
            // Logs error
            logger.error('User workplace membership removal failed', { error, userId, workplaceId })

            // Throws formatted error
            throw {
                success: false,
                message: UserCode.DATABASE_ERROR,
                code: 400,
                stack: error instanceof Error ? error : new Error('Database operation failed')
            }
        }
    }

    /**
     * Helper method to build include options for Sequelize queries.
     * This method handles the inclusion of related models based on the requested includes.
     * 
     * @param include - Array of relation names to include
     * @returns Array of Sequelize include options
     */
    private getIncludeOptions(include: string[]): any[] {
        // Initializes an empty array for include options
        const includeOptions: any[] = []

        // Adds workplace inclusion if requested
        if (include.includes('workplaces')) {
            includeOptions.push({
                model: Workplace,
                as: 'workplaces',
                through: { attributes: [] }
            })
        }

        // Adds workplace membership inclusion if requested
        if (include.includes('workplaceMemberships')) {
            includeOptions.push({
                model: WorkplaceMembership,
                as: 'workplace_memberships',
                include: [{
                    model: Role,
                    as: 'role'
                }]
            })
        }

        // Adds role inclusion if requested
        if (include.includes('role')) {
            includeOptions.push({
                model: Role,
                as: 'role'
            })
        }

        // Returns the constructed include options
        return includeOptions
    }

    /**
     * Ensures all existing users have private groups
     * This can be called as part of a migration or startup process
     */
    async ensureAllUsersHavePrivateGroups(): Promise<void> {
        try {
            const users = await User.findAll({
                where: {
                    current_workplace_id: { $ne: null }
                }
            });

            logger.info(`Checking private groups for ${users.length} users`);

            for (const user of users) {
                try {
                    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'User';
                    await this.privateGroupService.ensurePrivateGroupExists(
                        user.uuid, 
                        user.current_workplace_id!, 
                        userName
                    );
                } catch (error) {
                    logger.warn('Failed to ensure private group for user', { 
                        userId: user.uuid, 
                        error 
                    });
                }
            }

            logger.info('Completed private group check for all users');
        } catch (error) {
            logger.error('Failed to ensure private groups for all users', { error });
            throw error;
        }
    }

    /**
     * Creates a private group for a user when they join a workplace
     */
    async ensureUserHasPrivateGroup(userId: string, workplaceId: string): Promise<void> {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'User';
            await this.privateGroupService.ensurePrivateGroupExists(userId, workplaceId, userName);
            
            logger.info('Ensured private group exists for user', { userId, workplaceId });
        } catch (error) {
            logger.error('Failed to ensure private group for user', { error, userId, workplaceId });
            throw error;
        }
    }
}

// Export a singleton instance of the UserService
export default new UserService()
