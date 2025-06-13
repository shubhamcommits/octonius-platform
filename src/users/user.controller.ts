// Import Express
import { Request, Response } from 'express'

// Import Services
import { UserService } from './user.service'

// Import Logger
import logger from '../logger'

/**
 * Controller class for handling user-related HTTP requests.
 * This class acts as an interface between HTTP requests and the UserService.
 */
export class UserController {
    private readonly userService: UserService

    /**
     * Creates a new instance of UserController.
     * 
     * @param userService - The service responsible for user-related business logic
     */
    constructor(userService: UserService) {
        this.userService = userService
    }

    /**
     * Creates a new user.
     * 
     * @param req - Express request object containing user data
     * @param res - Express response object
     * @returns Created user data or error response
     */
    async createUser(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Creating new user', {
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            })

            // Extracts user data from request body
            const userData = req.body

            // Creates user using the service
            const user = await this.userService.create(userData)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful creation
            logger.info('User created successfully', {
                userId: user.user.uuid,
                responseTime: `${responseTime}ms`,
                statusCode: 201
            })

            // Returns success response with created user data
            return res.status(201).json({
                success: true,
                data: user,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in createUser controller', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                responseTime: `${responseTime}ms`,
                statusCode: 500,
                body: req.body
            })

            // Returns error response
            return res.status(500).json({
                success: false,
                message: 'Failed to create user',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Retrieves a user by their UUID.
     * 
     * @param req - Express request object containing user UUID
     * @param res - Express response object
     * @returns User data or error response
     */
    async getUserById(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Fetching user by UUID', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            })

            // Extracts UUID from request parameters
            const { uuid } = req.params

            // Retrieves user using the service
            const user = await this.userService.getById(uuid)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Returns 404 if user not found
            if (!user) {
                logger.warn('User not found', {
                    uuid,
                    responseTime: `${responseTime}ms`,
                    statusCode: 404
                })

                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    meta: {
                        responseTime: `${responseTime}ms`
                    }
                })
            }

            // Log successful retrieval
            logger.info('User retrieved successfully', {
                userId: user.user.uuid,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with user data
            return res.status(200).json({
                success: true,
                data: user,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in getUserById controller', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                responseTime: `${responseTime}ms`,
                statusCode: 500,
                params: req.params
            })

            // Returns error response
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch user',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Retrieves a user by their email.
     * 
     * @param req - Express request object containing email
     * @param res - Express response object
     * @returns User data or error response
     */
    async getUserByEmail(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Fetching user by email', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            })

            // Extracts email from URL parameters
            const { email } = req.params

            // Validates email parameter
            if (!email) {
                const responseTime = Date.now() - startTime
                logger.warn('Email parameter missing', {
                    responseTime: `${responseTime}ms`,
                    statusCode: 400
                })

                return res.status(400).json({
                    success: false,
                    message: 'Email is required',
                    meta: {
                        responseTime: `${responseTime}ms`
                    }
                })
            }

            // Retrieves user using the service
            const user = await this.userService.getByEmail(email)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Returns 404 if user not found
            if (!user) {
                logger.warn('User not found by email', {
                    email,
                    responseTime: `${responseTime}ms`,
                    statusCode: 404
                })

                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    meta: {
                        responseTime: `${responseTime}ms`
                    }
                })
            }

            // Log successful retrieval
            logger.info('User retrieved by email successfully', {
                userId: user.user.uuid,
                email,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with user data
            return res.status(200).json({
                success: true,
                data: user,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error: any) {

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in getUserByEmail controller', {
                stack: error,
                error: error.stack instanceof Error ? error.stack.message : 'Unknown error',
                responseTime: `${responseTime}ms`,
                statusCode: 500,
                params: req.params
            })

            // Returns error response
            return res.status(error.code).json({
                success: false,
                message: error.message,
                error: error.stack instanceof Error ? error.stack.message : 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Retrieves a paginated list of users.
     * 
     * @param req - Express request object containing query parameters
     * @param res - Express response object
     * @returns Paginated user data or error response
     */
    async getUsers(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Fetching users list', {
                method: req.method,
                path: req.path,
                query: req.query,
                ip: req.ip
            })

            // Extracts query parameters
            const { page, limit, search, include } = req.query

            // Retrieves users using the service
            const response = await this.userService.getAll({
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined,
                search: search as string,
                include: include ? (include as string).split(',') : undefined
            })

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful retrieval
            logger.info('Users list retrieved successfully', {
                count: response.users.users.length,
                total: response.users.total,
                page: page || 1,
                limit: limit || 10,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with paginated data
            return res.status(200).json({
                success: true,
                data: response.users.users,
                pagination: {
                    total: response.users.total,
                    page: page ? parseInt(page as string) : 1,
                    limit: limit ? parseInt(limit as string) : 10
                },
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in getUsers controller', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                responseTime: `${responseTime}ms`,
                statusCode: 500,
                query: req.query
            })

            // Returns error response
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch users',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Updates a user's information.
     * 
     * @param req - Express request object containing user data
     * @param res - Express response object
     * @returns Updated user data or error response
     */
    async updateUser(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Updating user', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            })

            // Extracts UUID and update data from request
            const { uuid } = req.params
            const updateData = req.body

            // Updates user using the service
            const user = await this.userService.update(uuid, updateData)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful update
            logger.info('User updated successfully', {
                userId: user.user.uuid,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response with updated user data
            return res.status(200).json({
                success: true,
                data: user,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in updateUser controller', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                responseTime: `${responseTime}ms`,
                statusCode: 500,
                params: req.params,
                body: req.body
            })

            // Returns error response
            return res.status(500).json({
                success: false,
                message: 'Failed to update user',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Deletes a user.
     * 
     * @param req - Express request object containing user UUID
     * @param res - Express response object
     * @returns Success or error response
     */
    async deleteUser(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Deleting user', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            })

            // Extracts UUID from request parameters
            const { uuid } = req.params

            // Deletes user using the service
            await this.userService.delete(uuid)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful deletion
            logger.info('User deleted successfully', {
                userId: uuid,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response
            return res.status(200).json({
                success: true,
                message: 'User deleted successfully',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in deleteUser controller', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                responseTime: `${responseTime}ms`,
                statusCode: 500,
                params: req.params
            })

            // Returns error response
            return res.status(500).json({
                success: false,
                message: 'Failed to delete user',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Adds a user to a workplace.
     * 
     * @param req - Express request object containing membership data
     * @param res - Express response object
     * @returns Created membership data or error response
     */
    async addUserToWorkplace(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Adding user to workplace', {
                method: req.method,
                path: req.path,
                params: req.params,
                body: req.body,
                ip: req.ip
            })

            // Extracts user UUID from URL parameters and workplace data from body
            const { uuid } = req.params
            const { workplaceId, roleId } = req.body

            // Validates required fields
            if (!workplaceId || !roleId) {
                const responseTime = Date.now() - startTime
                logger.warn('Missing required fields for workplace membership', {
                    responseTime: `${responseTime}ms`,
                    statusCode: 400
                })

                return res.status(400).json({
                    success: false,
                    message: 'workplaceId and roleId are required',
                    meta: {
                        responseTime: `${responseTime}ms`
                    }
                })
            }

            // Creates membership using the service
            const membership = await this.userService.addToWorkplace(uuid, workplaceId, roleId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful addition
            logger.info('User added to workplace successfully', {
                userId: uuid,
                workplaceId,
                roleId,
                responseTime: `${responseTime}ms`,
                statusCode: 201
            })

            // Returns success response with membership data
            return res.status(201).json({
                success: true,
                data: membership,
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in addUserToWorkplace controller', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                responseTime: `${responseTime}ms`,
                statusCode: 500,
                params: req.params,
                body: req.body
            })

            // Returns error response
            return res.status(500).json({
                success: false,
                message: 'Failed to add user to workplace',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }

    /**
     * Removes a user from a workplace.
     * 
     * @param req - Express request object containing membership data
     * @param res - Express response object
     * @returns Success or error response
     */
    async removeUserFromWorkplace(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now()
        
        try {
            logger.info('Removing user from workplace', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            })

            // Extracts user UUID and workplace ID from URL parameters
            const { uuid, workplaceId } = req.params

            // Removes membership using the service
            await this.userService.removeFromWorkplace(uuid, workplaceId)

            // Calculate response time
            const responseTime = Date.now() - startTime

            // Log successful removal
            logger.info('User removed from workplace successfully', {
                userId: uuid,
                workplaceId,
                responseTime: `${responseTime}ms`,
                statusCode: 200
            })

            // Returns success response
            return res.status(200).json({
                success: true,
                message: 'User removed from workplace successfully',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        } catch (error) {
            // Calculate response time
            const responseTime = Date.now() - startTime

            // Logs the error for debugging
            logger.error('Error in removeUserFromWorkplace controller', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                responseTime: `${responseTime}ms`,
                statusCode: 500,
                params: req.params
            })

            // Returns error response
            return res.status(500).json({
                success: false,
                message: 'Failed to remove user from workplace',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: {
                    responseTime: `${responseTime}ms`
                }
            })
        }
    }
}

// Create and export a singleton instance of the UserController
const userService = new UserService()
export default new UserController(userService)
