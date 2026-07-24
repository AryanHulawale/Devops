import logger from '../config/logger.js';
import jwttoken from '../utils/jwt.js';

/**
 * Middleware that verifies the JWT token from cookies and
 * attaches the decoded user payload to req.user.
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res
        .status(401)
        .json({
          error: 'Authentication required',
          message: 'No token provided',
        });
    }

    const decoded = jwttoken.verify(token);
    req.user = decoded;

    next();
  } catch (e) {
    logger.error('Auth middleware error', e);
    return res
      .status(401)
      .json({
        error: 'Authentication required',
        message: 'Invalid or expired token',
      });
  }
};
