import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';

import { User } from './app/user';
import { GraphqlContext } from './interface';
import { jwtService } from './services/jwt';

async function init() {
    const PORT = Number(process.env.PORT) || 3000
    const app = express()

    app.use(cors())
    app.use(express.json())

    const server= new ApolloServer<GraphqlContext>({
        typeDefs: `
            ${User.types}

            type Query {
                ${User.queries}
            }
        `,
        resolvers: {
            Query: {
               ...User.resolvers.queries 
            }
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

