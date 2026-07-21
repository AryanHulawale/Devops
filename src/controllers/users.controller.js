import logger from '../config/logger.js';
import { userIdSchema, updateUserSchema } from '../validations/users.validation.js';
import { formatValidationError } from '../utils/format.js';
import {
  getAllUsers as getAllUsersService,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '../services/users.service.js';

/**
 * GET /api/users
 * Retrieve all users.
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await getAllUsersService();

    logger.info(`Fetched ${users.length} users`);
    res.status(200).json({ users });
  } catch (e) {
    logger.error('Get all users error', e);
    next(e);
  }
};

/**
 * GET /api/users/:id
 * Retrieve a user by ID.
 */
export const getUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    const user = await getUserByIdService(id);

    logger.info(`Fetched user: ${user.email}`);
    res.status(200).json({ user });
  } catch (e) {
    logger.error('Get user by ID error', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

/**
 * PUT /api/users/:id
 * Update a user's information.
 * - Authenticated users can only update their own info.
 * - Only admins can change the "role" field of any user.
 */
export const updateUser = async (req, res, next) => {
  try {
    // Validate the ID param
    const idValidation = userIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidation.error),
      });
    }

    // Validate the request body
    const bodyValidation = updateUserSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = idValidation.data;
    const updates = bodyValidation.data;

    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Non-admin users can only update their own information
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'You can only update your own information' });
    }

    // Only admins can change the "role" field
    if (updates.role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change user roles' });
    }

    const updatedUser = await updateUserService(id, updates);

    logger.info(`User ${id} updated by ${req.user.email}`);
    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (e) {
    logger.error('Update user error', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

/**
 * DELETE /api/users/:id
 * Delete a user.
 * - Authenticated users can delete their own account.
 * - Admins can delete any user.
 */
export const deleteUser = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Non-admin users can only delete their own account
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'You can only delete your own account' });
    }

    await deleteUserService(id);

    logger.info(`User ${id} deleted by ${req.user.email}`);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (e) {
    logger.error('Delete user error', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};
