import Redis from "ioredis"

export const redisClient = new Redis(process.env.REDIS_CONNECTION_STRING as string);