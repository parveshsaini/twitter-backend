import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { prismaClient } from "../clients/db"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { CreateTweetPayload } from "../interface"


const s3Client= new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    },
    region: process.env.AWS_REGION
} )

const gettAllTweetsService= async()=> {
    return await prismaClient.tweet.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    })
}

const getSignedUrlService= async(imageType: string, imageName: string)=> {
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

const createTweetService= async(payload: CreateTweetPayload, id: string)=> {
    const tweet= await prismaClient.tweet.create({
        data: {
            content: payload.content,
            imageUrl: payload.imageUrl,
            author: {connect: { id }}
        }
    })

    return tweet
}

const getTweetsById= async (id: string)=> {
    const tweets= await prismaClient.tweet.findMany({
        where: { authorId: id }
    })

    return tweets
}

const deleteTweetService= async (id: string, userId: string)=> {
    const tweet= await prismaClient.tweet.findUnique({
        where:{id}
    })

    if(!tweet){
        throw new Error("Tweet not found")
    }

    if(tweet.authorId!==userId){
        throw new Error("Unauthorized")
    }

    await prismaClient.tweet.delete({
        where: {id}
    })

    return true
}

export const TweetServices= {
    gettAllTweetsService,
    getSignedUrlService,
    createTweetService,
    getTweetsById,
    deleteTweetService
}