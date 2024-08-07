import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';

import { GraphqlContext } from './interface';
import { jwtService } from './services/jwt';

import { User } from './app/user';
import { Tweet } from './app/tweet';
import { Chat } from './app/chat';
import { app, httpServer } from './socket/socket';
import { startMessageConsumer } from './clients/kafka';
import { Likes } from './app/like';


async function init() {
    const PORT = Number(process.env.PORT) || 3000

    startMessageConsumer()

    app.use(cors({
        origin: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }));
    
    app.use(express.json())

    app.get("/", (req, res)=> {
        res.status(200).json({
            message: "Server Health"
        })
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

    httpServer.listen(PORT, ()=> console.log(`Server is running on port ${PORT}`))
}

init()

