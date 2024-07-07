import { PutObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"
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

        const imageExtention= imageType.split("/")[1]

        const putObjectCommand= new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: `tweets/${imageName}-${Date.now()}.${imageExtention}`,
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

// const deleteTweetService= async (id: string, userId: string)=> {
//     const tweet= await prismaClient.tweet.findUnique({
//         where:{id}
//     })

//     if(!tweet){
//         throw new Error("Tweet not found")
//     }

//     if(tweet.authorId!==userId){
//         throw new Error("Unauthorized")
//     }

//     await prismaClient.tweet.delete({
//         where: {id}
//     })

//     return true
// }

const deleteTweetService = async (id: string, userId: string) => {
    const tweet = await prismaClient.tweet.findUnique({
      where: { id },
    });
  
    if (!tweet) {
      throw new Error("Tweet not found");
    }
  
    if (tweet.authorId !== userId) {
      throw new Error("Unauthorized");
    }
  
    try {
        if (tweet.imageUrl) {
          const url = new URL(tweet.imageUrl);
          const imagePath = url.pathname.substring(1); // Remove leading slash
      
          const deleteObjectCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: imagePath,
          });

          console.log('image path is: ', imagePath)
      
          await s3Client.send(deleteObjectCommand);
        }
      
        await prismaClient.likes.deleteMany({
            where: { tweetId: id }
        })
        await prismaClient.tweet.delete({
          where: { id },
        });

      
        return true;
    } catch (error: any) {
        throw new Error("Failed to delete tweet "+ error);
    }
  };

const likeTweetService= async(id: string, userId: string)=> {
    const tweet= await prismaClient.tweet.findUnique({
        where: {id}
    })

    if(!tweet){
        throw new Error("Tweet not found")
    }

    const isLiked= await prismaClient.likes.findUnique({
        where: {
            userId_tweetId: {
                userId,
                tweetId: id
            }
        }
    })

    if(isLiked){
        //already liked
        return isLiked
    }

    await prismaClient.likes.create({
        data: {
            tweet: { connect: { id } },
            user: { connect: { id: userId } }
        }
    })

    const like= await prismaClient.likes.findUnique({
        where:{
            userId_tweetId:{
                userId,
                tweetId: id
            
            }
        }
    })
    console.log(like)
    return like
    
}

const unlikeTweetService= async(id: string, userId: string)=> {
    const tweet= await prismaClient.tweet.findUnique({
        where: {id}
    })

    if(!tweet){
        throw new Error("Tweet not found")
    }

    const isLiked= await prismaClient.likes.findUnique({
        where: {
            userId_tweetId: {
                userId,
                tweetId: id
            }
        }
    })

    if(!isLiked){
        //not liked
        return false
    }

    await prismaClient.likes.delete({
        where: {
            userId_tweetId: {
                userId,
                tweetId: id
            }
        }
    })

    return true

}

export const TweetServices= {
    gettAllTweetsService,
    getSignedUrlService,
    createTweetService,
    getTweetsById,
    deleteTweetService,
    likeTweetService,
    unlikeTweetService
}