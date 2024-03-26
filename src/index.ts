import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';

import { User } from './app/user';

async function init() {
    const PORT = Number(process.env.PORT) || 3000
    const app = express()
    
    app.use(cors())
    app.use(express.json())

    const server= new ApolloServer({
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



    app.use(expressMiddleware(server))

    app.listen(PORT, ()=> console.log(`Server is running on port ${PORT}`))
}

init()

