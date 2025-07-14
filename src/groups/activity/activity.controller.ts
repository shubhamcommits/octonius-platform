import { Request, Response } from 'express';
import { GroupActivityService } from './activity.service';
import logger from '../../logger';
import { GroupActivityLike, GroupActivityComment } from './activity.model';

/**
 * Controller class for handling group activity post HTTP requests.
 * This class acts as an interface between HTTP requests and the GroupActivityService.
 */
export class GroupActivityController {
    private readonly activityService: GroupActivityService;

    /**
     * Creates a new instance of GroupActivityController.
     * @param activityService - The service responsible for group activity business logic
     */
    constructor(activityService: GroupActivityService) {
        this.activityService = activityService;
    }

    /**
     * Lists all activity posts for a group.
     * @param req - Express request object
     * @param res - Express response object
     * @returns List of posts or error response
     */
    async list(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now();
        try {
            logger.info('Fetching group activity posts', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            });
            const { group_id } = req.params;
            const user_id = req.user?.uuid;
            const posts = await this.activityService.list(group_id);

            // Enhance posts with likeCount, likedByCurrentUser, commentCount
            const enhancedPosts = await Promise.all(posts.map(async (post: any) => {
                const [likeCount, commentCount, likedByCurrentUser] = await Promise.all([
                    this.activityService.likeCount(post.uuid),
                    this.activityService.commentCount(post.uuid),
                    user_id ? this.activityService.isLikedByUser(post.uuid, user_id) : false
                ]);
                const postObject = typeof post.toJSON === 'function' ? post.toJSON() : post;
                return {
                    ...postObject,
                    like_count: likeCount,
                    comment_count: commentCount,
                    liked_by_current_user: likedByCurrentUser
                };
            }));

            const responseTime = Date.now() - startTime;
            logger.info('Group activity posts fetched', { group_id, responseTime: `${responseTime}ms` });
            return res.status(200).json({
                success: true,
                data: enhancedPosts,
                meta: { responseTime: `${responseTime}ms` }
            });
        } catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Error in list group activity posts', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                responseTime: `${responseTime}ms`,
                params: req.params
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch group activity posts',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: { responseTime: `${responseTime}ms` }
            });
        }
    }

    /**
     * Gets a specific activity post.
     * @param req - Express request object
     * @param res - Express response object
     * @returns Post data or error response
     */
    async get(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now();
        try {
            logger.info('Fetching group activity post', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            });
            const { group_id, postId } = req.params;
            const user_id = req.user?.uuid;
            const post = await this.activityService.get(group_id, postId);
            if (!post) {
                const responseTime = Date.now() - startTime;
                logger.warn('Group activity post not found', { group_id, postId, responseTime: `${responseTime}ms` });
                return res.status(404).json({
                    success: false,
                    message: 'Post not found',
                    meta: { responseTime: `${responseTime}ms` }
                });
            }
            // Enhance post with likeCount, likedByCurrentUser, commentCount
            const [likeCount, commentCount, likedByCurrentUser] = await Promise.all([
                this.activityService.likeCount(post.uuid),
                this.activityService.commentCount(post.uuid),
                user_id ? this.activityService.isLikedByUser(post.uuid, user_id) : false
            ]);
            const enhancedPost = {
                ...post.toJSON(),
                like_count: likeCount,
                comment_count: commentCount,
                liked_by_current_user: likedByCurrentUser
            };
            const responseTime = Date.now() - startTime;
            logger.info('Group activity post fetched', { group_id, postId, responseTime: `${responseTime}ms` });
            return res.status(200).json({
                success: true,
                data: enhancedPost,
                meta: { responseTime: `${responseTime}ms` }
            });
        } catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Error in get group activity post', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                responseTime: `${responseTime}ms`,
                params: req.params
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch group activity post',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: { responseTime: `${responseTime}ms` }
            });
        }
    }

    /**
     * Creates a new activity post.
     * @param req - Express request object
     * @param res - Express response object
     * @returns Created post data or error response
     */
    async create(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now();
        try {
            logger.info('Creating group activity post', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            });
            const { group_id } = req.params;
            const user_id = req.user?.uuid;
            if (!user_id) {
                const responseTime = Date.now() - startTime;
                logger.warn('Unauthorized attempt to create group activity post', { responseTime: `${responseTime}ms` });
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized',
                    meta: { responseTime: `${responseTime}ms` }
                });
            }
            const post = await this.activityService.create(group_id, user_id, req.body);
            const responseTime = Date.now() - startTime;
            logger.info('Group activity post created', { group_id, user_id, responseTime: `${responseTime}ms` });
            return res.status(201).json({
                success: true,
                data: post,
                meta: { responseTime: `${responseTime}ms` }
            });
        } catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Error in create group activity post', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                responseTime: `${responseTime}ms`,
                params: req.params
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to create group activity post',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: { responseTime: `${responseTime}ms` }
            });
        }
    }

    /**
     * Updates an activity post.
     * @param req - Express request object
     * @param res - Express response object
     * @returns Updated post data or error response
     */
    async update(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now();
        try {
            logger.info('Updating group activity post', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            });
            const { group_id, postId } = req.params;
            const post = await this.activityService.update(group_id, postId, req.body);
            const responseTime = Date.now() - startTime;
            if (!post) {
                logger.warn('Group activity post not found for update', { group_id, postId, responseTime: `${responseTime}ms` });
                return res.status(404).json({
                    success: false,
                    message: 'Post not found',
                    meta: { responseTime: `${responseTime}ms` }
                });
            }
            logger.info('Group activity post updated', { group_id, postId, responseTime: `${responseTime}ms` });
            return res.status(200).json({
                success: true,
                data: post,
                meta: { responseTime: `${responseTime}ms` }
            });
        } catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Error in update group activity post', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                responseTime: `${responseTime}ms`,
                params: req.params
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to update group activity post',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: { responseTime: `${responseTime}ms` }
            });
        }
    }

    /**
     * Deletes an activity post.
     * @param req - Express request object
     * @param res - Express response object
     * @returns Success or error response
     */
    async delete(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now();
        try {
            logger.info('Deleting group activity post', {
                method: req.method,
                path: req.path,
                params: req.params,
                ip: req.ip
            });
            const { group_id, postId } = req.params;
            await this.activityService.delete(group_id, postId);
            const responseTime = Date.now() - startTime;
            logger.info('Group activity post deleted', { group_id, postId, responseTime: `${responseTime}ms` });
            return res.status(200).json({
                success: true,
                message: 'Post deleted',
                meta: { responseTime: `${responseTime}ms` }
            });
        } catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Error in delete group activity post', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                responseTime: `${responseTime}ms`,
                params: req.params
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to delete group activity post',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: { responseTime: `${responseTime}ms` }
            });
        }
    }

    async like(req: Request, res: Response): Promise<Response> {
        const { postId } = req.params;
        const user_id = req.user?.uuid;
        if (!user_id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        await this.activityService.like(postId, user_id);
        const count = await this.activityService.likeCount(postId);
        return res.status(200).json({ success: true, liked: true, likeCount: count });
    }

    async unlike(req: Request, res: Response): Promise<Response> {
        const { postId } = req.params;
        const user_id = req.user?.uuid;
        if (!user_id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        await this.activityService.unlike(postId, user_id);
        const count = await this.activityService.likeCount(postId);
        return res.status(200).json({ success: true, liked: false, likeCount: count });
    }

    async likeCount(req: Request, res: Response): Promise<Response> {
        const { postId } = req.params;
        const count = await this.activityService.likeCount(postId);
        return res.status(200).json({ success: true, likeCount: count });
    }

    async listComments(req: Request, res: Response): Promise<Response> {
        const { postId } = req.params;
        const comments = await this.activityService.listComments(postId);
        return res.status(200).json({ success: true, data: comments });
    }

    async createComment(req: Request, res: Response): Promise<Response> {
        const { postId } = req.params;
        const user_id = req.user?.uuid;
        if (!user_id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const comment = await this.activityService.createComment(postId, user_id, req.body);
        return res.status(201).json({ success: true, data: comment });
    }

    async deleteComment(req: Request, res: Response): Promise<Response> {
        const { postId, commentId } = req.params;
        const user_id = req.user?.uuid;
        if (!user_id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const deleted = await this.activityService.deleteComment(postId, commentId, user_id);
        if (deleted) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(404).json({ success: false, message: 'Comment not found or not authorized' });
        }
    }

    async commentCount(req: Request, res: Response): Promise<Response> {
        const { postId } = req.params;
        const count = await this.activityService.commentCount(postId);
        return res.status(200).json({ success: true, commentCount: count });
    }
} 