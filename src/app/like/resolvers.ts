import { Likes } from "@prisma/client"
import { prismaClient } from "../../clients/db"
import { GraphqlContext } from "../../interface"
import { TweetServices } from "../../services/tweet"

const mutations= {
    likeTweet: async (_parent: any, {id}: {id: string}, ctx: GraphqlContext)=> {
        if(!ctx.user){
            throw new Error("Unauthorized")
        }

        const like= await TweetServices.likeTweetService(id, ctx.user.id)
        // await redisClient.del(`ALL_TWEETS`)

        return like
    
    },
    unlikeTweet: async (_parent: any, {id}: {id: string}, ctx: GraphqlContext)=> {
        if(!ctx.user){
            throw new Error("Unauthorized")
        }

        const res= await TweetServices.unlikeTweetService(id, ctx.user.id)
        // await redisClient.del(`ALL_TWEETS`)

        return res
    }
}


const extraResolvers= {
    Likes: {
        tweet: async (_parent: Likes)=>{
            return await prismaClient.tweet.findUnique({
                where: {
                    id: _parent.tweetId
                }
            })
        },
        user: async (_parent: Likes)=>{
            return await prismaClient.user.findUnique({
                where: {
                    id: _parent.userId
                }
            })
        }
    }
}

export const resolvers = {mutations, extraResolvers}