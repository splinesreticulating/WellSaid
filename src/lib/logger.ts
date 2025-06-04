import { LOG_LEVEL } from '$env/static/private'
import pino from 'pino'

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  level: LOG_LEVEL || 'info',
})
