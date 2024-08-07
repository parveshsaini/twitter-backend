
import { GraphqlContext } from "../../interface";
import { User } from "@prisma/client";
import { UserServices } from "../../services/user";
import { TweetServices } from "../../services/tweet";
import { prismaClient } from "../../clients/db";
import { redisClient } from "../../clients/redis";
  

const queries = {
    verifyGoogleToken: async (_parent: any, {token}: {token: string}) =>{
        const jwtToken= await UserServices.verifyGoogleTokenService(token)
        return jwtToken
    },

    getCurrentUser: async(_parent: any, args: any, ctx: GraphqlContext)=> {
        const id =  ctx.user?.id
        if(!id) return null

        const cachedCurrentUser= await redisClient.get(`CURRENT_USER:${id}`)
        if(cachedCurrentUser){
          return JSON.parse(cachedCurrentUser)
        }

        const user= await UserServices.getCurrentUserService(id)

        redisClient.set(`CURRENT_USER:${id}`, JSON.stringify(user))

        return user
    },

    getUserById: async(_parent: any, {id}: {id: string})=> {
        const cachedUser= await redisClient.get(`USER:${id}`)
        if(cachedUser){
          return JSON.parse(cachedUser)
        }

        const user= await UserServices.getUserByIdService(id)

        redisClient.set(`USER:${id}`, JSON.stringify(user))
        return user
    }

}

const mutations= {
    followUser: async(_parent: any, {to}: {to: string}, ctx: GraphqlContext)=> {
        const from= ctx.user?.id

        if(!from){
            throw new Error('User not authenticated')
        }

        if(from===to){
            return false
        }

        await UserServices.followUserService(from, to)
        await redisClient.del(`RECOMMENDED_USERS:${from}`)

        return true
    },

    unfollowUser: async(_parent: any, {to}: {to: string}, ctx: GraphqlContext)=> {
        const from= ctx.user?.id

        if(!from){
            throw new Error('User not authenticated')
        }

        if(from===to){
            return false
        }

        await UserServices.unfollowUserService(from, to)
        await redisClient.del(`RECOMMENDED_USERS:${from}`)

        return true
    }
}

const extraResolvers= {
    User: {
        tweets: async (_parent: User)=> {
            return await TweetServices.getTweetsById(_parent.id)
        },

        likes: async (_parent: User)=> {
            return await prismaClient.likes.findMany({
                where: { userId: _parent.id},
                include: { tweet: true}
            })
        },

        followers: async (_parent: User)=> {
            const res= await prismaClient.follows.findMany({
                where: { followingId: _parent.id},
                include: { follower: true}
            })

            // console.log(res)

            return res.map((r)=> r.follower)
        },

        following: async (_parent: User)=> {
            const res= await prismaClient.follows.findMany({
                where: { followerId: _parent.id},
                include: {following: true}
            })

            // console.log(res)

            return res.map((r)=> r.following)
        },

        messages: async (_parent: User)=>{
          const messages= await prismaClient.message.findMany({
            where:{ senderId: _parent.id},
            include: {conversation: true, 
              sender: true}
          })

          return messages
        },

        recommendedUsers: async (_parent: User, _: any, ctx: GraphqlContext) => {
            if (!ctx.user) return [];

            //cehck for cached users
            const cachedUsers= await redisClient.get(`RECOMMENDED_USERS:${ctx.user.id}`)
            if(cachedUsers){
              return JSON.parse(cachedUsers)
            }

            const myFollowings = await prismaClient.follows.findMany({
              where: {
                follower: { id: ctx.user.id },
              },
              include: {
                following: {
                  include: { followers: { include: { following: true } } },
                },
              },
            });
      
            const users: User[] = [];
      
            for (const followings of myFollowings) {
              for (const followingOfFollowedUser of followings.following.followers) {
                if (
                  followingOfFollowedUser.following.id !== ctx.user.id &&
                  myFollowings.findIndex(
                    (e) => e?.followingId === followingOfFollowedUser.following.id
                  ) < 0
                ) {
                  users.push(followingOfFollowedUser.following);
                }
              }
            }
            
            //cache recommended users
            redisClient.set(`RECOMMENDED_USERS:${ctx.user.id}`, JSON.stringify(users))

            return users;
          },
    }
}


export const resolvers = {queries, mutations, extraResolvers}