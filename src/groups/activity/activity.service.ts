import { GroupActivityPost, GroupActivityLike, GroupActivityComment } from './activity.model';
import { CreateGroupActivityPostInput, UpdateGroupActivityPostInput } from './activity.type';
import logger from '../../logger';
import { User } from '../../users/user.model';

// Import Cache Service
import { CacheService } from '../../shared/cache.service';

export class GroupActivityService {
  async list(group_id: string) {
    // Validate group_id parameter
    if (!group_id) {
      logger.error('GroupActivityService.list: group_id is undefined or null', { group_id });
      throw new Error('Group ID is required');
    }

    // Check cache first
    const cachedPosts = await CacheService.getActivityFeed(group_id);
    if (cachedPosts) {
      logger.info('Activity posts retrieved from cache', { group_id });
      return cachedPosts;
    }
    
    logger.info('GroupActivityService.list: Executing query', { group_id });
    
    const posts = await GroupActivityPost.findAll({ 
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

    // Cache the results
    await CacheService.setActivityFeed(group_id, posts);
    logger.info('Activity posts cached successfully', { group_id, count: posts.length });

    return posts;
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
    const post = await GroupActivityPost.create({
      group_id,
      user_id,
      content: input.content,
    });

    // Invalidate activity feed cache
    await CacheService.invalidateActivityFeed(group_id);
    logger.info('Activity feed cache invalidated after post creation', { group_id, post_id: post.uuid });

    return post;
  }

  async update(group_id: string, uuid: string, input: UpdateGroupActivityPostInput) {
    const post = await GroupActivityPost.findOne({ where: { group_id, uuid } });
    if (!post) return null;
    await post.update(input);

    // Invalidate activity feed cache
    await CacheService.invalidateActivityFeed(group_id);
    await CacheService.invalidateActivityPost(uuid);
    logger.info('Activity caches invalidated after post update', { group_id, post_id: uuid });

    return post;
  }

  async delete(group_id: string, uuid: string) {
    const result = await GroupActivityPost.destroy({ where: { group_id, uuid } });
    
    // Invalidate activity feed cache
    await CacheService.invalidateActivityFeed(group_id);
    await CacheService.invalidateActivityPost(uuid);
    logger.info('Activity caches invalidated after post deletion', { group_id, post_id: uuid });

    return result;
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