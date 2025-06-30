import { GroupActivityPost, GroupActivityLike, GroupActivityComment } from './activity.model';
import { CreateGroupActivityPostInput, UpdateGroupActivityPostInput } from './activity.type';
import logger from '../../logger';
import { User } from '../../users/user.model';

export class GroupActivityService {
  async list(group_id: string) {
    // Validate group_id parameter
    if (!group_id) {
      logger.error('GroupActivityService.list: group_id is undefined or null', { group_id });
      throw new Error('Group ID is required');
    }
    
    logger.info('GroupActivityService.list: Executing query', { group_id });
    
    return GroupActivityPost.findAll({ 
      where: { group_id }, 
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['uuid', 'first_name', 'last_name', 'avatar_url']
        }
      ]
    });
  }

  async get(group_id: string, uuid: string) {
    return GroupActivityPost.findOne({ 
      where: { group_id, uuid },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['uuid', 'first_name', 'last_name', 'avatar_url']
        }
      ]
    });
  }

  async create(group_id: string, user_id: string, input: CreateGroupActivityPostInput) {
    return GroupActivityPost.create({
      group_id,
      user_id,
      content: input.content,
    });
  }

  async update(group_id: string, uuid: string, input: UpdateGroupActivityPostInput) {
    const post = await GroupActivityPost.findOne({ where: { group_id, uuid } });
    if (!post) return null;
    await post.update(input);
    return post;
  }

  async delete(group_id: string, uuid: string) {
    return GroupActivityPost.destroy({ where: { group_id, uuid } });
  }

  async like(post_id: string, user_id: string) {
    return GroupActivityLike.findOrCreate({
      where: { post_id, user_id },
      defaults: { post_id, user_id }
    });
  }

  async unlike(post_id: string, user_id: string) {
    return GroupActivityLike.destroy({ where: { post_id, user_id } });
  }

  async likeCount(post_id: string) {
    return GroupActivityLike.count({ where: { post_id } });
  }

  async isLikedByUser(post_id: string, user_id: string) {
    const like = await GroupActivityLike.findOne({ where: { post_id, user_id } });
    return !!like;
  }

  async listComments(post_id: string) {
    return GroupActivityComment.findAll({
      where: { post_id },
      order: [['created_at', 'ASC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['uuid', 'first_name', 'last_name', 'avatar_url']
        }
      ]
    });
  }

  async createComment(post_id: string, user_id: string, input: { content: string }) {
    return GroupActivityComment.create({
      post_id,
      user_id,
      content: input.content
    });
  }

  async deleteComment(post_id: string, comment_id: string, user_id: string) {
    // Only allow deleting own comment
    return GroupActivityComment.destroy({ where: { uuid: comment_id, post_id, user_id } });
  }

  async commentCount(post_id: string) {
    return GroupActivityComment.count({ where: { post_id } });
  }
} 