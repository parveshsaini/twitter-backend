import { Redis } from "ioredis"

export const pub= new Redis(process.env.REDIS_CONNECTION_STRING!)
export const sub= new Redis(process.env.REDIS_CONNECTION_STRING!)