import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interface";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { UserServices } from "../../services/user";
import { TweetServices } from "../../services/tweet";
import { CreateTweetPayload } from "../../interface";


const queries= {
    
    getAllTweets: async () =>{
        return await TweetServices.gettAllTweetsService()
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

                const tweet= await TweetServices.createTweetService(payload, ctx.user.id)
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
