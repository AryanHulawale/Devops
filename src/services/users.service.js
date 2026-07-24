import logger from '../config/logger.js';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users } from '../models/user.model.js';

/**
 * Retrieve all users from the database.
 * Excludes the password field from the results.
 */
export const getAllUsers = async () => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users);

    logger.info(`Fetched ${allUsers.length} users`);
    return allUsers;
  } catch (e) {
    logger.error(`Error fetching all users: ${e}`);
    throw e;
  }
};

/**
 * Retrieve a single user by ID.
 * Excludes the password field from the result.
 * @param {number} id - The user's ID
 */
export const getUserById = async id => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new Error('User not found');

    logger.info(`Fetched user by ID: ${id}`);
    return user;
  } catch (e) {
    logger.error(`Error fetching user by ID ${id}: ${e}`);
    throw e;
  }
};

/**
 * Update a user's information.
 * @param {number} id - The user's ID
 * @param {object} updates - Fields to update (name, email, role)
 */
export const updateUser = async (id, updates) => {
  try {
    // Check if the user exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) throw new Error('User not found');

    // Add the updated_at timestamp
    const updatedFields = { ...updates, updated_at: new Date() };

    const [updatedUser] = await db
      .update(users)
      .set(updatedFields)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    logger.info(`User ${id} updated successfully`);
    return updatedUser;
  } catch (e) {
    logger.error(`Error updating user ${id}: ${e}`);
    throw e;
  }
};

/**
 * Delete a user from the database.
 * @param {number} id - The user's ID
 */
export const deleteUser = async id => {
  try {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) throw new Error('User not found');

    await db.delete(users).where(eq(users.id, id));

    logger.info(`User ${id} deleted successfully`);
    return { message: 'User deleted successfully' };
  } catch (e) {
    logger.error(`Error deleting user ${id}: ${e}`);
    throw e;
  }
};
