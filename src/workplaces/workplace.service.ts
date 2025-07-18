// Import Models
import { Op } from 'sequelize'
import Workplace from './workplace.model'
import WorkplaceMembership from './workplace-membership.model'
import WorkplaceInvitation from './workplace-invitation.model'
import User from '../users/user.model'
import Role from '../roles/role.model'
import RoleService from '../roles/role.service'

// Import Logger
import logger from '../logger'

// Import Workplace Codes
import { WorkplaceCode } from './workplace.code'

// Import Workplace Types
import { WorkplaceResponse, WorkplacesResponse, WorkplaceError, WorkplaceMembersResponse } from './workplace.type'

// Import Notification Service
import { NotificationService } from '../notifications/notification.service'

// Import crypto for token generation
import * as crypto from 'crypto'

// Import environment
import { getEnv } from '../config/env'

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

    /**
     * Selects a workplace for a user (sets as current workplace)
     * @param user_id - The UUID of the user
     * @param workplace_id - The UUID of the workplace
     * @returns Success or error response
     */
    async selectWorkplace(user_id: string, workplace_id: string): Promise<WorkplaceResponse<{ user_id: string, workplace_id: string, user?: any }> | WorkplaceError> {
        try {
            // Check if the user is a member of the workplace
            const membership = await WorkplaceMembership.findOne({
                where: {
                    user_id,
                    workplace_id,
                    status: 'active'
                }
            })
            if (!membership) {
                return {
                    success: false,
                    message: WorkplaceCode.WORKPLACE_NOT_FOUND,
                    code: 404,
                    stack: new Error('User is not a member of this workplace')
                }
            }
            // Set current_workplace_id in user profile
            const user = await User.findByPk(user_id)
            if (!user) {
                return {
                    success: false,
                    message: WorkplaceCode.USER_NOT_IN_WORKPLACE,
                    code: 404,
                    stack: new Error('User not found')
                }
            }
            user.current_workplace_id = workplace_id
            await user.save()
            // Return success with updated user
            return {
                success: true,
                message: WorkplaceCode.WORKPLACE_SELECTED,
                code: 200,
                workplace: { user_id, workplace_id, user }
            }
        } catch (error: any) {
            // Return an error response
            return { 
                success: false, 
                code: error.code || 500, 
                message: error.message || 'Failed to select workplace',
                stack: error.stack || ''
            }
        }
    }

    /**
     * Gets all workplaces
     * @returns All workplaces or error
     */
    async getAllWorkplaces(): Promise<WorkplacesResponse<Workplace[]> | WorkplaceError> {
        try {
            // Find all workplaces
            const workplaces = await Workplace.findAll({
                attributes: ['uuid', 'name', 'logo_url', 'createdAt', 'updatedAt'],
                order: [['createdAt', 'DESC']]
            })

            // Return success response
            return {
                success: true,
                code: 200,
                message: 'Workplaces retrieved successfully',
                workplaces: workplaces.map(wp => wp.toJSON())
            }
        } catch (error: any) {
            // Return error response
            return {
                success: false,
                code: error.code || 500,
                message: error.message || 'Failed to retrieve workplaces',
                stack: error instanceof Error ? error : new Error(error.message || 'Unknown error')
            }
        }
    }

    /**
     * Creates a new workplace
     * @param name - Name of the workplace
     * @param logo_url - Optional logo URL
     * @param created_by - UUID of the user creating the workplace
     * @returns Created workplace or error
     */
    async createWorkplace(name: string, created_by: string, logo_url?: string): Promise<WorkplaceResponse<Workplace> | WorkplaceError> {
        try {
            // Validate name
            if (!name || name.trim().length === 0) {
                return {
                    success: false,
                    code: 400,
                    message: 'Workplace name is required',
                    stack: new Error('Workplace name is required')
                }
            }

            // Check if workplace with same name already exists
            const existingWorkplace = await Workplace.findOne({
                where: { name: name.trim() }
            })

            if (existingWorkplace) {
                return {
                    success: false,
                    code: 409,
                    message: 'Workplace with this name already exists',
                    stack: new Error('Workplace with this name already exists')
                }
            }

            // Create new workplace
            const workplace = await Workplace.create({
                name: name.trim(),
                logo_url: logo_url || null,
                created_by,
                timezone: 'UTC',
                active: true
            })

            // Return success response
            return {
                success: true,
                code: 201,
                message: 'Workplace created successfully',
                workplace: workplace.toJSON()
            }
        } catch (error: any) {
            // Return error response
            return {
                success: false,
                code: error.code || 500,
                message: error.message || 'Failed to create workplace',
                stack: error instanceof Error ? error : new Error(error.message || 'Unknown error')
            }
        }
    }

    /**
     * Gets a workplace by ID
     * @param workplace_id - The UUID of the workplace
     * @returns Workplace or error response
     */
    async getWorkplaceById(workplace_id: string): Promise<WorkplaceResponse<Workplace> | WorkplaceError> {
        try {
            // Log the operation
            logger.info('Getting workplace by ID', { workplace_id })

            // Find the workplace
            const workplace = await Workplace.findOne({
                where: { 
                    uuid: workplace_id,
                    active: true 
                }
            })

            if (!workplace) {
                return {
                    success: false,
                    message: WorkplaceCode.WORKPLACE_NOT_FOUND,
                    code: 404,
                    stack: new Error('Workplace not found')
                }
            }

            // Log success
            logger.info('Workplace retrieved successfully', { workplace_id })

            // Return success response
            return {
                success: true,
                message: WorkplaceCode.WORKPLACE_FOUND,
                code: 200,
                workplace
            }
        } catch (error) {
            // Log error
            logger.error('Failed to get workplace by ID', { error, workplace_id })

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
     * Updates workplace settings
     * @param workplace_id - The UUID of the workplace
     * @param updateData - The data to update
     * @returns Updated workplace or error response
     */
    async updateWorkplaceSettings(workplace_id: string, updateData: any): Promise<WorkplaceResponse<Workplace> | WorkplaceError> {
        try {
            // Log the operation
            logger.info('Updating workplace settings', { workplace_id, updateData })

            // Find the workplace
            const workplace = await Workplace.findOne({
                where: { 
                    uuid: workplace_id,
                    active: true 
                }
            })

            if (!workplace) {
                return {
                    success: false,
                    message: WorkplaceCode.WORKPLACE_NOT_FOUND,
                    code: 404,
                    stack: new Error('Workplace not found')
                }
            }

            // Update the workplace
            await workplace.update(updateData)

            // Log success
            logger.info('Workplace settings updated successfully', { workplace_id })

            // Return success response
            return {
                success: true,
                message: 'Workplace settings updated successfully',
                code: 200,
                workplace
            }
        } catch (error) {
            // Log error
            logger.error('Failed to update workplace settings', { error, workplace_id })

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
     * Gets workplace members with detailed information
     * @param workplace_id - The UUID of the workplace
     * @param current_user_id - The UUID of the current user
     * @param options - Pagination and search options
     * @returns Workplace members or error response
     */
    async getWorkplaceMembers(
        workplace_id: string, 
        current_user_id: string,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
        } = {}
    ): Promise<WorkplaceMembersResponse<any> | WorkplaceError> {
        try {
            // Log the operation
            logger.info('Getting workplace members', { workplace_id, current_user_id, options })

            // Default pagination options
            const limit = options.limit || 20;
            const offset = options.offset || 0;
            const search = options.search || '';

            // Build where clause for search
            const userWhereClause: any = {};
            if (search) {
                userWhereClause[Op.or] = [
                    { first_name: { [Op.iLike]: `%${search}%` } },
                    { last_name: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } }
                ];
            }

            // Get total count for pagination
            const totalCount = await WorkplaceMembership.count({
                where: { 
                    workplace_id,
                    status: 'active'
                },
                include: search ? [{
                    model: User,
                    as: 'user',
                    where: userWhereClause,
                    required: true
                }] : undefined
            });

            // Get workplace memberships with user details
            const memberships = await WorkplaceMembership.findAll({
                where: { 
                    workplace_id,
                    status: 'active'
                },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url'],
                        where: search ? userWhereClause : undefined,
                        required: true
                    },
                    {
                        model: Role,
                        as: 'role',
                        attributes: ['name']
                    }
                ],
                order: [['created_at', 'ASC']],
                limit,
                offset
            })

            // Transform the data to match the expected format
            const members = memberships.map((membership: any) => ({
                uuid: membership.user.uuid,
                first_name: membership.user.first_name,
                last_name: membership.user.last_name,
                email: membership.user.email,
                avatar_url: membership.user.avatar_url,
                role: membership.role.name,
                status: membership.status,
                joined_at: membership.created_at,
                is_current_user: membership.user.uuid === current_user_id
            }))

            // Log success
            logger.info('Workplace members retrieved successfully', { 
                workplace_id, 
                memberCount: members.length,
                totalCount,
                limit,
                offset
            })

            // Return success response with pagination info
            return {
                success: true,
                message: 'Workplace members retrieved successfully',
                code: 200,
                members: {
                    data: members,
                    pagination: {
                        total: totalCount,
                        limit,
                        offset,
                        hasMore: offset + members.length < totalCount
                    }
                }
            }
        } catch (error) {
            // Log error
            logger.error('Failed to get workplace members', { error, workplace_id })

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
     * Gets workplace statistics
     * @param workplace_id - The UUID of the workplace
     * @returns Workplace statistics or error response
     */
    async getWorkplaceStats(workplace_id: string): Promise<WorkplaceResponse<any> | WorkplaceError> {
        try {
            // Log the operation
            logger.info('Getting workplace statistics', { workplace_id })

            // Get total users
            const totalUsers = await WorkplaceMembership.count({
                where: { 
                    workplace_id,
                    status: 'active'
                }
            })

            // Get admins (users with admin role)
            const adminMemberships = await WorkplaceMembership.findAll({
                where: { 
                    workplace_id,
                    status: 'active'
                },
                include: [{
                    model: Role,
                    as: 'role',
                    where: { name: 'admin' },
                    required: true
                }]
            })

            // Get regular members (non-admin users)
            const memberMemberships = await WorkplaceMembership.findAll({
                where: { 
                    workplace_id,
                    status: 'active'
                },
                include: [{
                    model: Role,
                    as: 'role',
                    where: { name: { [require('sequelize').Op.ne]: 'admin' } },
                    required: true
                }]
            })

            // Import Group model for stats calculation
            const { Group } = require('../groups/group.model')
            const { Op } = require('sequelize')

            // Get total work groups (regular type, excluding private groups)
            const totalWorkGroups = await Group.count({
                where: {
                    workplace_id,
                    is_active: true,
                    type: 'regular'
                }
            })

            // Get total agoras (public visibility - these are the public groups)
            const totalAgoras = await Group.count({
                where: {
                    workplace_id,
                    is_active: true,
                    settings: {
                        visibility: 'public'
                    }
                }
            })

            const stats = {
                total_users: totalUsers,
                total_admins: adminMemberships.length,
                total_members: memberMemberships.length,
                total_agoras: totalAgoras,
                total_work_groups: totalWorkGroups
            }

            // Log success
            logger.info('Workplace statistics retrieved successfully', { workplace_id, stats })

            // Return success response
            return {
                success: true,
                message: 'Workplace statistics retrieved successfully',
                code: 200,
                workplace: stats
            }
        } catch (error) {
            // Log error
            logger.error('Failed to get workplace statistics', { error, workplace_id })

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
     * Creates and sends a workplace invitation
     * @param workplace_id - The UUID of the workplace
     * @param email - Email to send invitation to
     * @param invited_by - UUID of the inviter
     * @param role_id - Role ID to assign to the invited user
     * @param message - Optional personal message
     * @returns Invitation or error response
     */
    async createInvitation(
        workplace_id: string,
        email: string,
        invited_by: string,
        role_id: string,
        message?: string
    ): Promise<WorkplaceResponse<WorkplaceInvitation> | WorkplaceError> {
        try {
            // Check if workplace exists
            const workplace = await Workplace.findByPk(workplace_id)
            if (!workplace) {
                return {
                    success: false,
                    message: WorkplaceCode.WORKPLACE_NOT_FOUND,
                    code: 404,
                    stack: new Error('Workplace not found')
                }
            }

            // Check if inviter is a member of the workplace
            const inviterMembership = await WorkplaceMembership.findOne({
                where: {
                    workplace_id,
                    user_id: invited_by,
                    status: 'active'
                },
                include: [{
                    model: Role,
                    as: 'role'
                }]
            })

            if (!inviterMembership) {
                return {
                    success: false,
                    message: 'You are not a member of this workplace',
                    code: 403,
                    stack: new Error('Not a workspace member')
                }
            }

            // Check if inviter has permission to invite users
            const canInvite = await RoleService.checkUserPermission(invited_by, workplace_id, 'user.invite')
            if (!canInvite) {
                return {
                    success: false,
                    message: 'You do not have permission to invite new members',
                    code: 403,
                    stack: new Error('Insufficient permissions')
                }
            }

            // Check if user with this email already exists and is a member
            const existingUser = await User.findOne({ where: { email } })
            if (existingUser) {
                const existingMembership = await WorkplaceMembership.findOne({
                    where: {
                        workplace_id,
                        user_id: existingUser.uuid,
                        status: 'active'
                    }
                })

                if (existingMembership) {
                    return {
                        success: false,
                        message: 'User is already a member of this workplace',
                        code: 409,
                        stack: new Error('User already a member')
                    }
                }
            }

            // Check for existing pending invitation
            const existingInvitation = await WorkplaceInvitation.findOne({
                where: {
                    email,
                    workplace_id,
                    status: 'pending'
                }
            })

            if (existingInvitation) {
                return {
                    success: false,
                    message: 'An invitation has already been sent to this email',
                    code: 409,
                    stack: new Error('Invitation already sent')
                }
            }

            // Generate secure token
            const token = crypto.randomBytes(32).toString('hex')
            
            // Set expiration to 7 days from now
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 7)

            // Create invitation
            const invitation = await WorkplaceInvitation.create({
                email,
                workplace_id,
                invited_by,
                role_id,
                token,
                expires_at: expiresAt,
                message,
                status: 'pending'
            })

            // Get inviter details
            const inviter = await User.findByPk(invited_by)
            const inviterName = inviter?.first_name && inviter?.last_name 
                ? `${inviter.first_name} ${inviter.last_name}` 
                : inviter?.email || 'A colleague'

            // Construct invitation link
            const appUrl = `https://${getEnv().DOMAIN}` || 'https://app.octonius.com'
            const invitationLink = `${appUrl}/auths/accept-invitation?token=${token}`

            // Send invitation email
            await new NotificationService().sendMail('workplace_invitation', {
                subject: `You're invited to join ${workplace.name} on Octonius`,
                email: email,
                inviterName: inviterName,
                workplaceName: workplace.name,
                invitationLink: invitationLink,
                message: message || '',
                expiresIn: '7 days'
            })

            logger.info('Workplace invitation created and sent', { 
                workplace_id, 
                email, 
                invited_by,
                invitation_id: invitation.uuid 
            })

            return {
                success: true,
                message: 'Invitation sent successfully',
                code: 201,
                workplace: invitation
            }
        } catch (error) {
            logger.error('Failed to create invitation', { error, workplace_id, email })
            return {
                success: false,
                message: WorkplaceCode.DATABASE_ERROR,
                code: 500,
                stack: error instanceof Error ? error : new Error('Database error')
            }
        }
    }

    /**
     * Gets all invitations for a workplace
     * @param workplace_id - The UUID of the workplace
     * @param status - Optional status filter
     * @returns Array of invitations
     */
    async getWorkplaceInvitations(
        workplace_id: string,
        status?: 'pending' | 'accepted' | 'rejected' | 'expired'
    ): Promise<WorkplacesResponse<WorkplaceInvitation[]> | WorkplaceError> {
        try {
            const where: any = { workplace_id }
            if (status) {
                where.status = status
            }

            const invitations = await WorkplaceInvitation.findAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'inviter',
                        attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                    },
                    {
                        model: Role,
                        as: 'role',
                        attributes: ['uuid', 'name']
                    }
                ],
                order: [['created_at', 'DESC']]
            })

            // Update expired invitations
            const now = new Date()
            for (const invitation of invitations) {
                if (invitation.status === 'pending' && invitation.expires_at < now) {
                    await invitation.update({ status: 'expired' })
                }
            }

            logger.info('Workplace invitations retrieved', { workplace_id, count: invitations.length })

            return {
                success: true,
                message: 'Invitations retrieved successfully',
                code: 200,
                workplaces: invitations
            }
        } catch (error) {
            logger.error('Failed to get workplace invitations', { error, workplace_id })
            return {
                success: false,
                message: WorkplaceCode.DATABASE_ERROR,
                code: 500,
                stack: error instanceof Error ? error : new Error('Database error')
            }
        }
    }

    /**
     * Verifies an invitation token and returns invitation details
     * @param token - The invitation token
     * @returns Invitation details or error
     */
    async verifyInvitation(token: string): Promise<WorkplaceResponse<any> | WorkplaceError> {
        try {
            // Find invitation by token
            const invitation = await WorkplaceInvitation.findOne({
                where: { token, status: 'pending' },
                include: [
                    {
                        model: Workplace,
                        as: 'workplace',
                        attributes: ['uuid', 'name']
                    }
                ]
            })

            if (!invitation) {
                return {
                    success: false,
                    message: 'Invalid or expired invitation',
                    code: 404,
                    stack: new Error('Invitation not found')
                }
            }

            // Check if invitation has expired
            if (invitation.expires_at < new Date()) {
                await invitation.update({ status: 'expired' })
                return {
                    success: false,
                    message: 'This invitation has expired',
                    code: 410,
                    stack: new Error('Invitation expired')
                }
            }

            return {
                success: true,
                message: 'Invitation verified successfully',
                code: 200,
                workplace: {
                    invitation: {
                        email: invitation.email,
                        workplace: (invitation as any).workplace,
                        expires_at: invitation.expires_at
                    }
                }
            } as WorkplaceResponse<any>
        } catch (error) {
            logger.error('Failed to verify invitation', { error, token })
            return {
                success: false,
                message: 'Failed to verify invitation',
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Accepts a workplace invitation
     * @param token - The invitation token
     * @param email - Email of the accepting user
     * @returns Updated invitation or error
     */
    async acceptInvitation(token: string, email: string): Promise<WorkplaceResponse<any> | WorkplaceError> {
        try {
            // Find invitation by token
            const invitation = await WorkplaceInvitation.findOne({
                where: { token, status: 'pending' },
                include: [
                    {
                        model: Workplace,
                        as: 'workplace'
                    },
                    {
                        model: Role,
                        as: 'role'
                    }
                ]
            })

            if (!invitation) {
                return {
                    success: false,
                    message: 'Invalid or expired invitation',
                    code: 404,
                    stack: new Error('Invitation not found')
                }
            }

            // Check if invitation has expired
            if (invitation.expires_at < new Date()) {
                await invitation.update({ status: 'expired' })
                return {
                    success: false,
                    message: 'This invitation has expired',
                    code: 410,
                    stack: new Error('Invitation expired')
                }
            }

            // Check if email matches
            if (invitation.email !== email) {
                return {
                    success: false,
                    message: 'This invitation was sent to a different email address',
                    code: 403,
                    stack: new Error('Email mismatch')
                }
            }

            // Find or create user
            let user = await User.findOne({ where: { email } })
            
            if (!user) {
                // Create new user with basic info
                user = await User.create({
                    email,
                    active: true,
                    timezone: 'UTC',
                    language: 'en',
                    notification_preferences: { email: true, push: true, in_app: true },
                    source: 'invitation',
                    metadata: {}
                })
            }

            // Create workplace membership
            await WorkplaceMembership.create({
                user_id: user.uuid,
                workplace_id: invitation.workplace_id,
                role_id: invitation.role_id,
                status: 'active',
                joined_at: new Date()
            })

            // Update user's current workplace if they don't have one
            if (!user.current_workplace_id) {
                await user.update({ current_workplace_id: invitation.workplace_id })
            }

            // Update invitation status
            await invitation.update({
                status: 'accepted',
                accepted_at: new Date(),
                user_id: user.uuid
            })

            const workplace = invitation.get('workplace') as Workplace

            logger.info('Invitation accepted', { 
                invitation_id: invitation.uuid,
                user_id: user.uuid,
                workplace_id: invitation.workplace_id
            })

            return {
                success: true,
                message: 'Invitation accepted successfully',
                code: 200,
                workplace: {
                    invitation,
                    user,
                    workplace,
                    needs_onboarding: !user.first_name || !user.last_name
                }
            }
        } catch (error) {
            logger.error('Failed to accept invitation', { error, token })
            return {
                success: false,
                message: WorkplaceCode.DATABASE_ERROR,
                code: 500,
                stack: error instanceof Error ? error : new Error('Database error')
            }
        }
    }

    /**
     * Cancels a pending invitation
     * @param invitation_id - The UUID of the invitation
     * @param cancelled_by - UUID of the user cancelling the invitation
     * @returns Success or error response
     */
    async cancelInvitation(invitation_id: string, cancelled_by: string): Promise<WorkplaceResponse<null> | WorkplaceError> {
        try {
            const invitation = await WorkplaceInvitation.findOne({
                where: {
                    uuid: invitation_id,
                    status: 'pending'
                }
            })

            if (!invitation) {
                return {
                    success: false,
                    message: 'Invitation not found or already processed',
                    code: 404,
                    stack: new Error('Invitation not found')
                }
            }

            // Check if user has permission to cancel (must be inviter or admin)
            const membership = await WorkplaceMembership.findOne({
                where: {
                    workplace_id: invitation.workplace_id,
                    user_id: cancelled_by,
                    status: 'active'
                },
                include: [{
                    model: Role,
                    as: 'role'
                }]
            })

            if (!membership) {
                return {
                    success: false,
                    message: 'You are not a member of this workplace',
                    code: 403,
                    stack: new Error('Not a workspace member')
                }
            }

            const role = membership.get('role') as Role
            if (role.name !== 'admin' && invitation.invited_by !== cancelled_by) {
                return {
                    success: false,
                    message: 'You do not have permission to cancel this invitation',
                    code: 403,
                    stack: new Error('Insufficient permissions')
                }
            }

            await invitation.update({
                status: 'rejected',
                rejected_at: new Date()
            })

            logger.info('Invitation cancelled', { invitation_id, cancelled_by })

            return {
                success: true,
                message: 'Invitation cancelled successfully',
                code: 200,
                workplace: null
            }
        } catch (error) {
            logger.error('Failed to cancel invitation', { error, invitation_id })
            return {
                success: false,
                message: WorkplaceCode.DATABASE_ERROR,
                code: 500,
                stack: error instanceof Error ? error : new Error('Database error')
            }
        }
    }
} 