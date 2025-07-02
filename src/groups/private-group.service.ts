import { Group } from './group.model'
import { GroupMembership } from './group-membership.model'
import logger from '../logger'

export class PrivateGroupService {
    
    /**
     * Creates a private group for a user on registration
     * This group is not visible in work management but serves as personal file storage
     */
    async createPrivateGroupForUser(userId: string, workplaceId: string, userName: string): Promise<Group> {
        try {
            const privateGroupName = `${userName}'s Private Space`;
            
            const privateGroup = await Group.create({
                name: privateGroupName,
                description: `Private group for ${userName} - personal file storage`,
                workplace_id: workplaceId,
                created_by: userId,
                type: 'private',
                is_active: true,
                settings: {
                    allow_member_invites: false,
                    require_approval: false,
                    visibility: 'private',
                    default_role: 'admin'
                },
                metadata: {
                    tags: ['personal', 'private'],
                    category: 'personal',
                    department: null
                }
            });

            // Add the user as the only member with admin role
            await GroupMembership.create({
                group_id: privateGroup.uuid,
                user_id: userId,
                role: 'admin',
                status: 'active',
                joined_at: new Date()
            });

            logger.info('Private group created for user', { 
                userId, 
                groupId: privateGroup.uuid, 
                groupName: privateGroupName 
            });

            return privateGroup;
        } catch (error) {
            logger.error('Failed to create private group for user', { 
                error, 
                userId, 
                workplaceId 
            });
            throw error;
        }
    }

    /**
     * Gets the private group for a user
     */
    async getPrivateGroupForUser(userId: string, workplaceId: string): Promise<Group | null> {
        try {
            const privateGroup = await Group.findOne({
                where: {
                    created_by: userId,
                    workplace_id: workplaceId,
                    type: 'private'
                }
            });

            return privateGroup;
        } catch (error) {
            logger.error('Failed to get private group for user', { 
                error, 
                userId, 
                workplaceId 
            });
            return null;
        }
    }

    /**
     * Ensures a user has a private group, creates one if it doesn't exist
     */
    async ensurePrivateGroupExists(userId: string, workplaceId: string, userName: string): Promise<Group> {
        try {
            let privateGroup = await this.getPrivateGroupForUser(userId, workplaceId);
            
            if (!privateGroup) {
                privateGroup = await this.createPrivateGroupForUser(userId, workplaceId, userName);
            }

            return privateGroup;
        } catch (error) {
            logger.error('Failed to ensure private group exists', { 
                error, 
                userId, 
                workplaceId 
            });
            throw error;
        }
    }

    /**
     * Checks if a group is a private group
     */
    async isPrivateGroup(groupId: string): Promise<boolean> {
        try {
            const group = await Group.findByPk(groupId);
            return group?.type === 'private';
        } catch (error) {
            logger.error('Failed to check if group is private', { error, groupId });
            return false;
        }
    }

    /**
     * Gets all regular (non-private) groups for work management display
     */
    async getRegularGroupsForWorkplace(workplaceId: string): Promise<Group[]> {
        try {
            const groups = await Group.findAll({
                where: {
                    workplace_id: workplaceId,
                    type: 'regular',
                    is_active: true
                },
                include: [
                    {
                        model: Group.sequelize?.models.User,
                        as: 'creator',
                        attributes: ['uuid', 'first_name', 'last_name', 'email']
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            return groups;
        } catch (error) {
            logger.error('Failed to get regular groups for workplace', { 
                error, 
                workplaceId 
            });
            throw error;
        }
    }
} 