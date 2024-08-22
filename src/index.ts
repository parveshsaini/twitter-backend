import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import client from "prom-client"
import { GraphqlContext } from './interface';
import { jwtService } from './services/jwt';
import responseTime from "response-time"
import { User } from './app/user';
import { Tweet } from './app/tweet';
import { Chat } from './app/chat';
import { app, httpServer } from './socket/socket';
import { startMessageConsumer } from './clients/kafka';
import { Likes } from './app/like';

import { createLogger, transports } from "winston"
import LokiTransport from "winston-loki"

const options = {
  transports: [
    new LokiTransport({
      host: "http://127.0.0.1:3100"
    })
  ]
};

export const logger = createLogger(options);


async function init() {
    const PORT = Number(process.env.PORT) || 3000

    const collectDefaultMetrics = client.collectDefaultMetrics
    collectDefaultMetrics({ register: client.register })

    startMessageConsumer()


    app.use(cors({
        origin: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }));
    
    app.use(express.json())
    
    const reqResTime = new client.Histogram({
        name: 'http_request_duration_seconds_custom',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'code'],
        buckets: [1, 50, 100, 500, 1000, 5000]
    })

    const totalReqCounter= new client.Counter({
        name: 'http_request_total_custom',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'code']
    })
  

    app.use(responseTime((req, res, time)=> {
        totalReqCounter.inc()
        reqResTime
        .labels(req.method!, req.url!, res.statusCode.toString())
        .observe(time)
    }
    ))

    app.get("/", (req, res)=> {
        logger.info("Server Healthy")
        res.status(200).json({
            message: "Server Health"
        })
    })

    app.get("/metrics", async(req, res)=> {
        res.setHeader('Content-Type', client.register.contentType)
        const metrics= await client.register.metrics()

        res.send(metrics)
    })

    const server= new ApolloServer<GraphqlContext>({
        typeDefs: `
            ${User.types}
            ${Tweet.types}
            ${Chat.types}
            ${Likes.types}

            type Query {
                ${User.queries}
                ${Tweet.queries}
                ${Chat.queries}
            }

            type Mutation {
                ${Tweet.mutations}
                ${User.mutations}
                ${Chat.mutations}
                ${Likes.mutations}
            }
        `,
        resolvers: {
            Query: {
               ...User.resolvers.queries,
               ...Tweet.resolvers.queries,
               ...Chat.resolvers.queries
            },

            Mutation: {
                ...Tweet.resolvers.mutations,
                ...User.resolvers.mutations,
                ...Chat.resolvers.mutations,
                ...Likes.resolvers.mutations
            },
            
            ...User.resolvers.extraResolvers,
            ...Tweet.resolvers.extraResolvers,
            ...Likes.resolvers.extraResolvers,
        }
    })

    await server.start()

    app.use(
        "/graphql", 
        expressMiddleware(server, {
            context: async({req}) => {
                return {
                    user: req.headers.authorization? jwtService.decodeToken(req.headers.authorization.split(' ')[1])
                    : undefined
                }
            }
        }))

    httpServer.listen(PORT, ()=>{
        logger.info(`Server is running on port ${PORT}`)
        console.log(`Server is running on port ${PORT}`)
    })
}

init()

