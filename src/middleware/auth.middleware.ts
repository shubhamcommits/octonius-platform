import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config';
import { User } from '../users/user.model';
import { Token } from '../auths/token.model';
import { appLogger } from '../logger';
import { sendError } from '../shared/handle-error';
import crypto from 'crypto';

// Extend Express Request for type safety
declare global {
  namespace Express {
    interface Request {
      user?: User | any;
    }
  }
}

// Constant-time token comparison
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      appLogger('Auth failed', { reason: 'Header missing', ip: req.ip, level: 'warn' });
      return sendError(res, 'No token provided', 'No token provided', 401);
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      appLogger('Auth failed', { reason: 'Token missing', ip: req.ip, level: 'warn' });
      return sendError(res, 'Token missing', 'Token missing', 401);
    }
    // Check if token is blacklisted
    const validToken = await Token.findOne({ where: { access_token: token, blacklisted: false } });
    if (!validToken || !safeCompare(validToken.access_token, token)) {
      appLogger('Auth failed', { reason: 'Token blacklisted', token, ip: req.ip, level: 'warn' });
      return sendError(res, 'Token blacklisted', 'Token blacklisted', 401);
    }
    const env = getEnv();
    // Optionally add audience/issuer checks if you use them
    jwt.verify(token, env.JWT_ACCESS_KEY, {
      // audience: env.JWT_AUDIENCE,
      // issuer: env.JWT_ISSUER,
    }, async (err: any, decoded: any) => {
      if (err || !decoded) {
        appLogger('Auth failed', { reason: 'Token invalid', token, ip: req.ip, level: 'warn' });
        return sendError(res, err, 'Token invalid', 401);
      }
      // Remove sensitive fields
      if (decoded.password) delete decoded.password;
      // Attach user to request
      const user = await User.findByPk(decoded.id);
      if (!user) {
        appLogger('Auth failed', { reason: 'User not found', userId: decoded.id, ip: req.ip, level: 'warn' });
        return sendError(res, 'User not found', 'User not found', 401);
      }
      req.user = user;
      next();
    });
  } catch (error: any) {
    appLogger('Auth error', { error: error.message, ip: req.ip, level: 'error' });
    return sendError(res, error, 'Internal server error', 500);
  }
}; 