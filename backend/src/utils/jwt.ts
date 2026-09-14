/**
 * JWT Utilities
 * Token verification helper used by WebSocket auth and other modules.
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

/**
 * Verify a JWT access token and return its decoded payload.
 * Returns null if the token is missing, malformed, or invalid.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
