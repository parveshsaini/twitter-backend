import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';

async function init() {
    const PORT = Number(process.env.PORT) || 3000
    const app = express()

    const server= new ApolloServer({
        typeDefs: ``,
        resolvers: {}
    })

    await server.start()

    app.use(cors())
    app.use(express.json())

    app.use(expressMiddleware(server))

    app.listen(PORT, ()=> console.log(`Server is running on port ${PORT}`))
}