import { Tweet } from "@prisma/client";
import { GraphqlContext } from "../../interface";
import { UserServices } from "../../services/user";
import { TweetServices } from "../../services/tweet";
import { CreateTweetPayload } from "../../interface";
import { redisClient } from "../../clients/redis";


const queries= {
    
    getAllTweets: async () =>{
        const cachedTweets= await redisClient.get(`ALL_TWEETS`)
        if(cachedTweets){
            return JSON.parse(cachedTweets)
        }
        
        const tweets= await TweetServices.gettAllTweetsService()

        redisClient.set(`ALL_TWEETS`, JSON.stringify(tweets))

        return tweets
    },

    getSignedUrl: async(_parent: any, {imageName, imageType}: {imageName: string, imageType: string}, ctx: GraphqlContext) => {
        if(!ctx.user){
            throw new Error("Unauthorized")
        }

        const signedUrl= await TweetServices.getSignedUrlService(imageType, imageName)
        return signedUrl
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

                const rateLimitFlag= await redisClient.get(`RATE_LIMIT:${ctx.user.id}`)
                if(rateLimitFlag){
                    throw new Error("Wait for few seconds before trying again :/")
                }

                const tweet= await TweetServices.createTweetService(payload, ctx.user.id)
                await redisClient.del(`ALL_TWEETS`)
                
                //rate limiting for 10 seconds
                redisClient.setex(`RATE_LIMIT:${ctx.user.id}`, 10,1)

                return tweet
        }
}

const extraResolvers = {
    Tweet: {
        author: async (_parent: Tweet)=> {
            return await UserServices.getUserByIdService(_parent.authorId)
        }
    }
}

export const resolvers = {queries, mutations, extraResolvers}
