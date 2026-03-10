import pino from 'pino';
import config from '../config/env.js';

// Define the transport for pretty printing in development
const transport = config.isProduction
    ? undefined
    : pino.transport({
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    });

// Create the logger instance
const logger = pino(
    {
        level: config.isProduction ? 'info' : 'debug',
        base: {
            env: config.isProduction ? 'production' : 'development',
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    transport
);

export default logger;
