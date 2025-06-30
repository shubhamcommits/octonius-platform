// Import Required Modules
import { Op, WhereOptions, IncludeOptions } from 'sequelize'
import { Group } from './group.model'
import { GroupMembership } from './group-membership.model'
import { User } from '../users/user.model'
import { Workplace } from '../workplaces/workplace.model'
import { GroupCode } from './group.code'
import { GroupResponse, GroupsResponse, GroupError, GroupMembersResponse } from './group.type'
import logger from '../logger'
import taskService from './tasks/task.service'
import { DEFAULT_AVATAR_URL } from '../config/constants'

/**
 * Group Service Class
 * Handles all group-related business logic and database operations
 */
export class GroupService {
    /**
     * Create a new work group
     */
    static async createGroup(groupData: {
        name: string
        description?: string
        image_url?: string
        workplace_id: string
        created_by: string
        settings?: any
        metadata?: any
    }): Promise<GroupResponse<Group> | GroupError> {
        try {
            // Check if group with same name exists in the workplace
            const existingGroup = await Group.findOne({
                where: {
                    name: groupData.name,
                    workplace_id: groupData.workplace_id,
                    is_active: true
                }
            })

            if (existingGroup) {
                return {
                    success: false,
                    message: GroupCode.GROUP_ALREADY_EXISTS,
                    code: 409,
                    stack: new Error(GroupCode.GROUP_ALREADY_EXISTS)
                }
            }

            // Create the group
            const group = await Group.create({
                name: groupData.name,
                description: groupData.description || null,
                image_url: groupData.image_url || null,
                workplace_id: groupData.workplace_id,
                created_by: groupData.created_by,
                settings: groupData.settings || {
                    allow_member_invites: true,
                    require_approval: false,
                    visibility: 'public',
                    default_role: 'member'
                },
                metadata: groupData.metadata || {
                    tags: [],
                    category: null,
                    department: null
                }
            })

            // Add creator as admin member
            await GroupMembership.create({
                group_id: group.uuid,
                user_id: groupData.created_by,
                role: 'admin',
                status: 'active',
                permissions: {
                    can_edit_group: true,
                    can_add_members: true,
                    can_remove_members: true,
                    can_create_tasks: true,
                    can_assign_tasks: true,
                    can_view_analytics: true
                }
            })

            // Create default task columns for the group
            await taskService.createDefaultColumns(group.uuid, groupData.created_by)

            logger.info(`Group created: ${group.uuid} by user: ${groupData.created_by}`)

            return {
                success: true,
                message: GroupCode.GROUP_CREATED,
                code: 201,
                group
            }
        } catch (error) {
            logger.error('Error creating group:', error)
            return {
                success: false,
                message: GroupCode.DATABASE_ERROR,
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Get all groups for a workplace
     */
    static async getGroupsByWorkplace(workplace_id: string, user_id: string): Promise<GroupsResponse<Group[]> | GroupError> {
        try {
            const includeOptions: IncludeOptions[] = [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                },
                {
                    model: GroupMembership,
                    as: 'group_memberships',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                        }
                    ]
                }
            ]

            const groups = await Group.findAll({
                where: {
                    workplace_id,
                    is_active: true
                },
                include: includeOptions,
                order: [['created_at', 'DESC']]
            })

            logger.info(`Retrieved ${groups.length} groups for workplace: ${workplace_id}`)

            return {
                success: true,
                message: GroupCode.GROUPS_FOUND,
                code: 200,
                groups
            }
        } catch (error) {
            logger.error('Error retrieving groups:', error)
            return {
                success: false,
                message: GroupCode.DATABASE_ERROR,
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Get a specific group by UUID
     */
    static async getGroupById(group_id: string, user_id: string): Promise<GroupResponse<Group> | GroupError> {
        try {
            const group = await Group.findOne({
                where: {
                    uuid: group_id,
                    is_active: true
                },
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                    },
                    {
                        model: GroupMembership,
                        as: 'group_memberships',
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                            }
                        ]
                    }
                ]
            })

            if (!group) {
                return {
                    success: false,
                    message: GroupCode.GROUP_NOT_FOUND,
                    code: 404,
                    stack: new Error(GroupCode.GROUP_NOT_FOUND)
                }
            }

            logger.info(`Retrieved group: ${group_id} by user: ${user_id}`)

            return {
                success: true,
                message: GroupCode.GROUP_FOUND,
                code: 200,
                group
            }
        } catch (error) {
            logger.error('Error retrieving group:', error)
            return {
                success: false,
                message: GroupCode.DATABASE_ERROR,
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Update a group
     */
    static async updateGroup(group_id: string, updateData: {
        name?: string
        description?: string
        image_url?: string
        settings?: any
        metadata?: any
    }, user_id: string): Promise<GroupResponse<Group> | GroupError> {
        try {
            const group = await Group.findOne({
                where: {
                    uuid: group_id,
                    is_active: true
                }
            })

            if (!group) {
                return {
                    success: false,
                    message: GroupCode.GROUP_NOT_FOUND,
                    code: 404,
                    stack: new Error(GroupCode.GROUP_NOT_FOUND)
                }
            }

            // Check if user has permission to edit the group
            const membership = await GroupMembership.findOne({
                where: {
                    group_id,
                    user_id,
                    status: 'active'
                }
            })

            if (!membership || !membership.permissions.can_edit_group) {
                return {
                    success: false,
                    message: GroupCode.INSUFFICIENT_PERMISSIONS,
                    code: 403,
                    stack: new Error(GroupCode.INSUFFICIENT_PERMISSIONS)
                }
            }

            // Check if name is being changed and if it conflicts
            if (updateData.name && updateData.name !== group.name) {
                const existingGroup = await Group.findOne({
                    where: {
                        name: updateData.name,
                        workplace_id: group.workplace_id,
                        uuid: { [Op.ne]: group_id },
                        is_active: true
                    }
                })

                if (existingGroup) {
                    return {
                        success: false,
                        message: GroupCode.GROUP_ALREADY_EXISTS,
                        code: 409,
                        stack: new Error(GroupCode.GROUP_ALREADY_EXISTS)
                    }
                }
            }

            // Update the group
            await group.update(updateData)

            logger.info(`Group updated: ${group_id} by user: ${user_id}`)

            return {
                success: true,
                message: GroupCode.GROUP_UPDATED,
                code: 200,
                group
            }
        } catch (error) {
            logger.error('Error updating group:', error)
            return {
                success: false,
                message: GroupCode.DATABASE_ERROR,
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Delete a group (soft delete)
     */
    static async deleteGroup(group_id: string, user_id: string): Promise<GroupResponse<Group> | GroupError> {
        try {
            const group = await Group.findOne({
                where: {
                    uuid: group_id,
                    is_active: true
                }
            })

            if (!group) {
                return {
                    success: false,
                    message: GroupCode.GROUP_NOT_FOUND,
                    code: 404,
                    stack: new Error(GroupCode.GROUP_NOT_FOUND)
                }
            }

            // Check if user has permission to delete the group
            const membership = await GroupMembership.findOne({
                where: {
                    group_id,
                    user_id,
                    role: 'admin',
                    status: 'active'
                }
            })

            if (!membership) {
                return {
                    success: false,
                    message: GroupCode.INSUFFICIENT_PERMISSIONS,
                    code: 403,
                    stack: new Error(GroupCode.INSUFFICIENT_PERMISSIONS)
                }
            }

            // Check if group has active tasks (you might want to implement this check)
            // For now, we'll just soft delete

            // Soft delete the group
            await group.update({ is_active: false })

            logger.info(`Group deleted: ${group_id} by user: ${user_id}`)

            return {
                success: true,
                message: GroupCode.GROUP_DELETED,
                code: 200,
                group
            }
        } catch (error) {
            logger.error('Error deleting group:', error)
            return {
                success: false,
                message: GroupCode.DATABASE_ERROR,
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Search groups by name
     */
    static async searchGroups(workplace_id: string, searchTerm: string, user_id: string): Promise<GroupsResponse<Group[]> | GroupError> {
        try {
            const whereCondition: WhereOptions = {
                workplace_id,
                is_active: true,
                name: {
                    [Op.iLike]: `%${searchTerm}%`
                }
            }

            const groups = await Group.findAll({
                where: whereCondition,
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                    },
                    {
                        model: GroupMembership,
                        as: 'group_memberships',
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                            }
                        ]
                    }
                ],
                order: [['name', 'ASC']]
            })

            logger.info(`Searched groups for term: ${searchTerm} in workplace: ${workplace_id}`)

            return {
                success: true,
                message: GroupCode.GROUPS_FOUND,
                code: 200,
                groups
            }
        } catch (error) {
            logger.error('Error searching groups:', error)
            return {
                success: false,
                message: GroupCode.DATABASE_ERROR,
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Add a member to a group
     */
    static async addMember(group_id: string, user_id: string, added_by: string, role: 'admin' | 'member' | 'viewer' = 'member'): Promise<GroupResponse<GroupMembership> | GroupError> {
        try {
            const group = await Group.findOne({
                where: {
                    uuid: group_id,
                    is_active: true
                }
            })

            if (!group) {
                return {
                    success: false,
                    message: GroupCode.GROUP_NOT_FOUND,
                    code: 404,
                    stack: new Error(GroupCode.GROUP_NOT_FOUND)
                }
            }

            // Check if user is already a member
            const existingMembership = await GroupMembership.findOne({
                where: {
                    group_id,
                    user_id,
                    status: 'active'
                }
            })

            if (existingMembership) {
                return {
                    success: false,
                    message: GroupCode.MEMBER_ALREADY_IN_GROUP,
                    code: 409,
                    stack: new Error(GroupCode.MEMBER_ALREADY_IN_GROUP)
                }
            }

            // Check if adder has permission to add members
            const adderMembership = await GroupMembership.findOne({
                where: {
                    group_id,
                    user_id: added_by,
                    status: 'active'
                }
            })

            if (!adderMembership || !adderMembership.permissions.can_add_members) {
                return {
                    success: false,
                    message: GroupCode.INSUFFICIENT_PERMISSIONS,
                    code: 403,
                    stack: new Error(GroupCode.INSUFFICIENT_PERMISSIONS)
                }
            }

            // Create membership
            const membership = await GroupMembership.create({
                group_id,
                user_id,
                role,
                invited_by: added_by,
                status: 'active',
                permissions: this.getDefaultPermissions(role)
            })

            logger.info(`Member added to group: ${group_id}, user: ${user_id} by: ${added_by}`)

            return {
                success: true,
                message: GroupCode.GROUP_MEMBER_ADDED,
                code: 201,
                group: membership
            }
        } catch (error) {
            logger.error('Error adding member to group:', error)
            return {
                success: false,
                message: GroupCode.DATABASE_ERROR,
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Remove a member from a group
     */
    static async removeMember(group_id: string, user_id: string, removed_by: string): Promise<GroupResponse<void> | GroupError> {
        try {
            const group = await Group.findOne({
                where: {
                    uuid: group_id,
                    is_active: true
                }
            })

            if (!group) {
                return {
                    success: false,
                    message: GroupCode.GROUP_NOT_FOUND,
                    code: 404,
                    stack: new Error(GroupCode.GROUP_NOT_FOUND)
                }
            }

            // Check if user is a member
            const membership = await GroupMembership.findOne({
                where: {
                    group_id,
                    user_id,
                    status: 'active'
                }
            })

            if (!membership) {
                return {
                    success: false,
                    message: GroupCode.MEMBER_NOT_IN_GROUP,
                    code: 404,
                    stack: new Error(GroupCode.MEMBER_NOT_IN_GROUP)
                }
            }

            // Check if remover has permission to remove members
            const removerMembership = await GroupMembership.findOne({
                where: {
                    group_id,
                    user_id: removed_by,
                    status: 'active'
                }
            })

            if (!removerMembership || !removerMembership.permissions.can_remove_members) {
                return {
                    success: false,
                    message: GroupCode.INSUFFICIENT_PERMISSIONS,
                    code: 403,
                    stack: new Error(GroupCode.INSUFFICIENT_PERMISSIONS)
                }
            }

            // Cannot remove yourself if you're the only admin
            if (user_id === removed_by && membership.role === 'admin') {
                const adminCount = await GroupMembership.count({
                    where: {
                        group_id,
                        role: 'admin',
                        status: 'active'
                    }
                })

                if (adminCount <= 1) {
                    return {
                        success: false,
                        message: GroupCode.INSUFFICIENT_PERMISSIONS,
                        code: 403,
                        stack: new Error(GroupCode.INSUFFICIENT_PERMISSIONS)
                    }
                }
            }

            // Soft delete membership
            await membership.update({ status: 'inactive' })

            logger.info(`Member removed from group: ${group_id}, user: ${user_id} by: ${removed_by}`)

            return {
                success: true,
                message: GroupCode.GROUP_MEMBER_REMOVED,
                code: 200,
                group: undefined
            }
        } catch (error) {
            logger.error('Error removing member from group:', error)
            return {
                success: false,
                message: GroupCode.DATABASE_ERROR,
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Get all members of a group
     */
    static async getGroupMembers(group_id: string, user_id: string): Promise<GroupMembersResponse<GroupMembership[]> | GroupError> {
        try {
            logger.info(`Attempting to retrieve members for group: ${group_id} by user: ${user_id}`)

            // Check if the group exists
            const group = await Group.findByPk(group_id)
            if (!group) {
                logger.warn(`Group not found: ${group_id}`)
                throw new Error('Group not found')
            }

            // Check if user has access to view members
            const userMembership = await GroupMembership.findOne({
                where: {
                    group_id: group_id,
                    user_id: user_id,
                    status: 'active'
                }
            })

            if (!userMembership) {
                logger.warn(`User ${user_id} does not have access to group ${group_id}`)
                throw new Error('Unauthorized access to group')
            }

            // Get all active members of the group with user details
            const members = await GroupMembership.findAll({
                where: {
                    group_id: group_id,
                    status: 'active'
                },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                }]
            })

            // Transform the members data to include avatar fallback
            const transformedMembers = members.map(member => {
                const memberData = member.toJSON() as any
                if (memberData.user) {
                    memberData.user.avatar_url = memberData.user.avatar_url || DEFAULT_AVATAR_URL
                }
                return memberData
            })

            logger.info(`Retrieved ${transformedMembers.length} members for group: ${group_id}`)

            return {
                success: true,
                message: GroupCode.GROUP_MEMBERS_FOUND,
                code: 200,
                members: transformedMembers
            }

        } catch (error: any) {
            logger.error('Error retrieving group members:', error)
            throw new Error('Database operation failed')
        }
    }

    /**
     * Update member role
     */
    static async updateMemberRole(group_id: string, member_id: string, new_role: 'admin' | 'member' | 'viewer', updated_by: string): Promise<GroupResponse<GroupMembership> | GroupError> {
        try {
            const group = await Group.findOne({
                where: {
                    uuid: group_id,
                    is_active: true
                }
            })

            if (!group) {
                return {
                    success: false,
                    message: GroupCode.GROUP_NOT_FOUND,
                    code: 404,
                    stack: new Error(GroupCode.GROUP_NOT_FOUND)
                }
            }

            // Check if updater has permission
            const updaterMembership = await GroupMembership.findOne({
                where: {
                    group_id,
                    user_id: updated_by,
                    role: 'admin',
                    status: 'active'
                }
            })

            if (!updaterMembership) {
                return {
                    success: false,
                    message: GroupCode.INSUFFICIENT_PERMISSIONS,
                    code: 403,
                    stack: new Error(GroupCode.INSUFFICIENT_PERMISSIONS)
                }
            }

            // Find the member to update
            const membership = await GroupMembership.findOne({
                where: {
                    uuid: member_id,
                    group_id,
                    status: 'active'
                },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['uuid', 'first_name', 'last_name', 'email', 'avatar_url']
                    }
                ]
            })

            if (!membership) {
                return {
                    success: false,
                    message: GroupCode.MEMBER_NOT_IN_GROUP,
                    code: 404,
                    stack: new Error(GroupCode.MEMBER_NOT_IN_GROUP)
                }
            }

            // Update role and permissions
            await membership.update({
                role: new_role,
                permissions: this.getDefaultPermissions(new_role)
            })

            logger.info(`Member role updated: ${member_id} to ${new_role} in group: ${group_id}`)

            return {
                success: true,
                message: GroupCode.GROUP_MEMBER_UPDATED,
                code: 200,
                group: membership
            }
        } catch (error) {
            logger.error('Error updating member role:', error)
            return {
                success: false,
                message: GroupCode.DATABASE_ERROR,
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Invite member by email (placeholder - would integrate with email service)
     */
    static async inviteMember(group_id: string, email: string, role: 'admin' | 'member' | 'viewer', invited_by: string, message?: string): Promise<GroupResponse<any> | GroupError> {
        try {
            const group = await Group.findOne({
                where: {
                    uuid: group_id,
                    is_active: true
                }
            })

            if (!group) {
                return {
                    success: false,
                    message: GroupCode.GROUP_NOT_FOUND,
                    code: 404,
                    stack: new Error(GroupCode.GROUP_NOT_FOUND)
                }
            }

            // Check if inviter has permission
            const inviterMembership = await GroupMembership.findOne({
                where: {
                    group_id,
                    user_id: invited_by,
                    status: 'active'
                }
            })

            if (!inviterMembership || !inviterMembership.permissions.can_add_members) {
                return {
                    success: false,
                    message: GroupCode.INSUFFICIENT_PERMISSIONS,
                    code: 403,
                    stack: new Error(GroupCode.INSUFFICIENT_PERMISSIONS)
                }
            }

            // Check if user with this email already exists and is a member
            const existingUser = await User.findOne({
                where: { email }
            })

            if (existingUser) {
                const existingMembership = await GroupMembership.findOne({
                    where: {
                        group_id,
                        user_id: existingUser.uuid,
                        status: 'active'
                    }
                })

                if (existingMembership) {
                    return {
                        success: false,
                        message: GroupCode.MEMBER_ALREADY_IN_GROUP,
                        code: 409,
                        stack: new Error(GroupCode.MEMBER_ALREADY_IN_GROUP)
                    }
                }
            }

            // For now, just return success - in a real implementation, you would:
            // 1. Create an invitation record
            // 2. Send email with invitation link
            // 3. Handle invitation acceptance flow

            logger.info(`Invitation sent to ${email} for group: ${group_id} by: ${invited_by}`)

            return {
                success: true,
                message: GroupCode.GROUP_INVITATION_SENT,
                code: 200,
                group: {
                    email,
                    role,
                    group_id,
                    invited_by,
                    message,
                    invited_at: new Date().toISOString()
                }
            }
        } catch (error) {
            logger.error('Error inviting member:', error)
            return {
                success: false,
                message: GroupCode.DATABASE_ERROR,
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Get pending invitations (placeholder)
     */
    static async getPendingInvitations(group_id: string, user_id: string): Promise<GroupResponse<any[]> | GroupError> {
        try {
            const group = await Group.findOne({
                where: {
                    uuid: group_id,
                    is_active: true
                }
            })

            if (!group) {
                return {
                    success: false,
                    message: GroupCode.GROUP_NOT_FOUND,
                    code: 404,
                    stack: new Error(GroupCode.GROUP_NOT_FOUND)
                }
            }

            // Check if user has permission to view invitations
            const membership = await GroupMembership.findOne({
                where: {
                    group_id,
                    user_id,
                    role: 'admin',
                    status: 'active'
                }
            })

            if (!membership) {
                return {
                    success: false,
                    message: GroupCode.INSUFFICIENT_PERMISSIONS,
                    code: 403,
                    stack: new Error(GroupCode.INSUFFICIENT_PERMISSIONS)
                }
            }

            // For now, return empty array - in real implementation, query invitation table
            const invitations: any[] = []

            return {
                success: true,
                message: GroupCode.GROUP_INVITATIONS_FOUND,
                code: 200,
                group: invitations
            }
        } catch (error) {
            logger.error('Error retrieving invitations:', error)
            return {
                success: false,
                message: GroupCode.DATABASE_ERROR,
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Cancel invitation (placeholder)
     */
    static async cancelInvitation(group_id: string, invitation_id: string, user_id: string): Promise<GroupResponse<void> | GroupError> {
        try {
            // For now, just return success - in real implementation, update invitation status
            logger.info(`Invitation cancelled: ${invitation_id} for group: ${group_id} by: ${user_id}`)

            return {
                success: true,
                message: GroupCode.GROUP_INVITATION_CANCELLED,
                code: 200,
                group: undefined
            }
        } catch (error) {
            logger.error('Error cancelling invitation:', error)
            return {
                success: false,
                message: GroupCode.DATABASE_ERROR,
                code: 500,
                stack: error as Error
            }
        }
    }

    /**
     * Get default permissions for a role
     */
    private static getDefaultPermissions(role: 'admin' | 'member' | 'viewer') {
        switch (role) {
            case 'admin':
                return {
                    can_edit_group: true,
                    can_add_members: true,
                    can_remove_members: true,
                    can_create_tasks: true,
                    can_assign_tasks: true,
                    can_view_analytics: true
                }
            case 'member':
                return {
                    can_edit_group: false,
                    can_add_members: false,
                    can_remove_members: false,
                    can_create_tasks: true,
                    can_assign_tasks: false,
                    can_view_analytics: false
                }
            case 'viewer':
                return {
                    can_edit_group: false,
                    can_add_members: false,
                    can_remove_members: false,
                    can_create_tasks: false,
                    can_assign_tasks: false,
                    can_view_analytics: false
                }
            default:
                return {
                    can_edit_group: false,
                    can_add_members: false,
                    can_remove_members: false,
                    can_create_tasks: true,
                    can_assign_tasks: false,
                    can_view_analytics: false
                }
        }
    }
} 