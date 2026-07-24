import { z } from 'zod';

/**
 * Schema to validate a user ID from request params.
 * Coerces the string param to a positive integer.
 */
export const userIdSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

/**
 * Schema to validate the update user request body.
 * All fields are optional, but at least one must be provided.
 */
export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(255).trim().optional(),
    email: z.email().max(255).toLowerCase().trim().optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
