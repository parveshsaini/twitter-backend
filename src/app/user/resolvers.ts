
import { GraphqlContext } from "../../interface";
import { User } from "@prisma/client";
import { UserServices } from "../../services/user";
import { TweetServices } from "../../services/tweet";
import { prismaClient } from "../../clients/db";
  

const queries = {
    verifyGoogleToken: async (_parent: any, {token}: {token: string}) =>{
        const jwtToken= await UserServices.verifyGoogleTokenService(token)
        return jwtToken
    },

    getCurrentUser: async(_parent: any, args: any, ctx: GraphqlContext)=> {
        const id =  ctx.user?.id

        if(!id) return null

        const user= await UserServices.getCurrentUserService(id)
        return user
    },

    getUserById: async(_parent: any, {id}: {id: string})=> {
        const user= await UserServices.getUserByIdService(id)
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
        return true
    }
}

const extraResolvers= {
    User: {
        tweets: async (_parent: User)=> {
            return await TweetServices.getTweetsById(_parent.id)
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

        recommendedUsers: async (_parent: User, _: any, ctx: GraphqlContext) => {
            if (!ctx.user) return [];
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
            return users;
          },
    }
}


export const resolvers = {queries, mutations, extraResolvers}