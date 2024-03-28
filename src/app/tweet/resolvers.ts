import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interface";

interface CreateTweetPayload {
    content: string;
    imageUrl?: string;
}

const queries= {
    
    getAllTweets: async () =>{
        return await prismaClient.tweet.findMany({
            orderBy: {createdAt: 'desc'}
        })
    }
}

const mutations = {
    createTweet: async (
        _parent: any, 
        {payload}: {payload: CreateTweetPayload}, 
        ctx: GraphqlContext) => {

                if(!ctx.user){
                    throw new Error("Unauthorized")
                }

                const tweet= await prismaClient.tweet.create({
                    data: {
                        content: payload.content,
                        imageUrl: payload.imageUrl,
                        author: {connect: {id: ctx.user.id}}
                    }
                })

                return tweet
        }
}

const extraResolvers = {
    Tweet: {
        author: async (_parent: Tweet)=> {
            return await prismaClient.user.findUnique({
                where: {id: _parent.authorId}
            })
        }
    }
}

export const resolvers = {queries, mutations, extraResolvers}
