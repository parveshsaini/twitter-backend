import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interface";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
interface CreateTweetPayload {
    content: string;
    imageUrl?: string;
}

const s3Client= new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    },
    region: process.env.AWS_REGION
} )

const queries= {
    
    getAllTweets: async () =>{
        return await prismaClient.tweet.findMany({
            orderBy: {createdAt: 'desc'}
        })
    },

    getSignedUrl: async(_parent: any, {imageName, imageType}: {imageName: string, imageType: string}, ctx: GraphqlContext) => {
        if(!ctx.user){
            throw new Error("Unauthorized")
        }

        const allowedImageType= ["image/jpg", "image/jpeg", "image/png", "image/webp"]

        if(!allowedImageType.includes(imageType)){
            throw new Error("Invalid image type")
        }

        const putObjectCommand= new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: `tweets/${imageName}-${Date.now()}.${imageType}`,
            ContentType: `image/${imageType}` 
        })

        const signedUrl= await getSignedUrl(s3Client, putObjectCommand)

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
