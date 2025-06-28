import { Request, Response } from 'express';
import { LoungeService } from './lounge.service';
import { sendResponse } from '../shared/handle-response';
import { sendError } from '../shared/handle-error';
import { LOUNGE_ERRORS } from './lounge.code';
import logger from '../logger';

export class LoungeController {
  private loungeService: LoungeService;

  constructor(loungeService: LoungeService) {
    this.loungeService = loungeService;
  }

  async list(req: Request, res: Response): Promise<Response> {
    const startTime = Date.now();
    try {
      logger.info('Fetching all lounge stories', { method: req.method, path: req.path, ip: req.ip });
      const stories = await this.loungeService.getAll();
      const responseTime = Date.now() - startTime;
      logger.info('Stories fetched', { count: stories.length, responseTime: `${responseTime}ms`, statusCode: 200 });
      return sendResponse(req, res, 200, { stories });
    } catch (err: any) {
      const responseTime = Date.now() - startTime;
      logger.error('Error in list controller', { error: err.message, stack: err.stack, responseTime: `${responseTime}ms`, statusCode: 500 });
      return sendError(res, err, 'Failed to fetch stories', 500);
    }
  }

  async get(req: Request, res: Response): Promise<Response> {
    const startTime = Date.now();
    try {
      logger.info('Fetching lounge story by UUID', { method: req.method, path: req.path, params: req.params, ip: req.ip });
      const story = await this.loungeService.getByUuid(req.params.uuid);
      const responseTime = Date.now() - startTime;
      if (!story) {
        logger.warn('Lounge story not found', { uuid: req.params.uuid, responseTime: `${responseTime}ms`, statusCode: 404 });
        return sendError(res, null, LOUNGE_ERRORS.NOT_FOUND, 404);
      }
      logger.info('Lounge story fetched', { uuid: req.params.uuid, responseTime: `${responseTime}ms`, statusCode: 200 });
      return sendResponse(req, res, 200, { story });
    } catch (err: any) {
      const responseTime = Date.now() - startTime;
      logger.error('Error in get controller', { error: err.message, stack: err.stack, responseTime: `${responseTime}ms`, statusCode: 500 });
      return sendError(res, err, 'Failed to fetch story', 500);
    }
  }

  async create(req: Request, res: Response): Promise<Response> {
    const startTime = Date.now();
    try {
      logger.info('Creating lounge story', { method: req.method, path: req.path, ip: req.ip });
      const story = await this.loungeService.create(req.body);
      const responseTime = Date.now() - startTime;
      logger.info('Lounge story created', { uuid: story.uuid, responseTime: `${responseTime}ms`, statusCode: 201 });
      return sendResponse(req, res, 201, { story });
    } catch (err: any) {
      const responseTime = Date.now() - startTime;
      logger.error('Error in create controller', { error: err.message, stack: err.stack, responseTime: `${responseTime}ms`, statusCode: 500 });
      return sendError(res, err, 'Failed to create story', 500);
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    const startTime = Date.now();
    try {
      logger.info('Updating lounge story', { method: req.method, path: req.path, params: req.params, ip: req.ip });
      const story = await this.loungeService.update(req.params.uuid, req.body);
      const responseTime = Date.now() - startTime;
      if (!story) {
        logger.warn('Lounge story not found for update', { uuid: req.params.uuid, responseTime: `${responseTime}ms`, statusCode: 404 });
        return sendError(res, null, LOUNGE_ERRORS.NOT_FOUND, 404);
      }
      logger.info('Lounge story updated', { uuid: req.params.uuid, responseTime: `${responseTime}ms`, statusCode: 200 });
      return sendResponse(req, res, 200, { story });
    } catch (err: any) {
      const responseTime = Date.now() - startTime;
      logger.error('Error in update controller', { error: err.message, stack: err.stack, responseTime: `${responseTime}ms`, statusCode: 500 });
      return sendError(res, err, 'Failed to update story', 500);
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const startTime = Date.now();
    try {
      logger.info('Deleting lounge story', { method: req.method, path: req.path, params: req.params, ip: req.ip });
      const story = await this.loungeService.delete(req.params.uuid);
      const responseTime = Date.now() - startTime;
      if (!story) {
        logger.warn('Lounge story not found for delete', { uuid: req.params.uuid, responseTime: `${responseTime}ms`, statusCode: 404 });
        return sendError(res, null, LOUNGE_ERRORS.NOT_FOUND, 404);
      }
      logger.info('Lounge story deleted', { uuid: req.params.uuid, responseTime: `${responseTime}ms`, statusCode: 200 });
      return sendResponse(req, res, 200, { story });
    } catch (err: any) {
      const responseTime = Date.now() - startTime;
      logger.error('Error in delete controller', { error: err.message, stack: err.stack, responseTime: `${responseTime}ms`, statusCode: 500 });
      return sendError(res, err, 'Failed to delete story', 500);
    }
  }
} 