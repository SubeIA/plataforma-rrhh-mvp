import { ValidationError } from '../errors/AppError.js';

/**
 * Zod validation middleware factory.
 * Validates req.body against the provided schema.
 *
 * Usage: validate(loginSchema)
 */
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        throw new ValidationError('Validation failed', errors);
    }

    // Replace body with parsed/transformed data
    req.body = result.data;
    next();
};

export default validate;
