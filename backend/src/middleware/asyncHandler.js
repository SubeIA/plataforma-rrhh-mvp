/**
 * Wraps async route handlers to catch errors and forward them
 * to the global error handler, eliminating repetitive try/catch blocks.
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
