import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';

import { GraphqlContext } from './interface';
import { jwtService } from './services/jwt';

import { User } from './app/user';
import { Tweet } from './app/tweet';


async function init() {
    const PORT = Number(process.env.PORT) || 3000
    const app = express()

    app.use(cors())
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

            type Query {
                ${User.queries}
                ${Tweet.queries}
            }

            type Mutation {
                ${Tweet.mutations}
                ${User.mutations}
            }
        `,
        resolvers: {
            Query: {
               ...User.resolvers.queries,
               ...Tweet.resolvers.queries
            },

            Mutation: {
                ...Tweet.resolvers.mutations,
                ...User.resolvers.mutations
            },
            
            ...User.resolvers.extraResolvers,
            ...Tweet.resolvers.extraResolvers
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

    app.listen(PORT, ()=> console.log(`Server is running on port ${PORT}`))
}

init()

