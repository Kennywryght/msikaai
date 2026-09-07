// backend/src/services/tokenService.js
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

class TokenService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    this.accessTokenExpiry = parseInt(process.env.ACCESS_TOKEN_EXPIRY) || 7 * 24 * 60 * 60; // 7 days in seconds
    this.refreshTokenExpiry = parseInt(process.env.REFRESH_TOKEN_EXPIRY) || 30 * 24 * 60 * 60; // 30 days in seconds
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate access token
   */
  generateAccessToken(userId, userData = {}) {
    try {
      const payload = {
        sub: userId,
        ...userData,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.accessTokenExpiry,
      };

      // In a production environment, you would use a JWT library
      // For now, we'll use a simple format (Supabase handles the actual JWT)
      const token = `${userId}_${Date.now()}_${this.generateSecureToken(16)}`;
      
      return {
        token,
        expiresAt: new Date(Date.now() + this.accessTokenExpiry * 1000),
      };
    } catch (error) {
      logger.error('Generate access token error:', error);
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    try {
      const token = `${userId}_refresh_${Date.now()}_${this.generateSecureToken(16)}`;
      
      return {
        token,
        expiresAt: new Date(Date.now() + this.refreshTokenExpiry * 1000),
      };
    } catch (error) {
      logger.error('Generate refresh token error:', error);
      throw error;
    }
  }

  /**
   * Validate token format
   */
  validateTokenFormat(token) {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Invalid token format' };
    }

    // Simple validation - check if token has expected format
    const parts = token.split('_');
    if (parts.length < 2) {
      return { valid: false, error: 'Malformed token' };
    }

    return { valid: true, error: null };
  }

  /**
   * Decode token (basic decoding)
   */
  decodeToken(token) {
    try {
      const parts = token.split('_');
      if (parts.length < 2) {
        return null;
      }

      const userId = parts[0];
      const timestamp = parseInt(parts[1]) || Date.now();

      return {
        userId,
        timestamp,
        token,
      };
    } catch (error) {
      logger.error('Decode token error:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token, maxAge) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return true;

      const now = Date.now();
      const tokenAge = now - decoded.timestamp;
      
      return tokenAge > maxAge;
    } catch (error) {
      return true;
    }
  }

  /**
   * Create token response
   */
  createTokenResponse(userId, userData = {}) {
    const accessToken = this.generateAccessToken(userId, userData);
    const refreshToken = this.generateRefreshToken(userId);

    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      tokenType: 'Bearer',
    };
  }

  /**
   * Hash token (for storage)
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Verify token signature (basic verification)
   */
  verifyTokenSignature(token, expectedUserId) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return false;
      
      return decoded.userId === expectedUserId;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const tokenService = new TokenService();

export default tokenService;