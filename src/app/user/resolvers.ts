
import { GraphqlContext } from "../../interface";
import { User } from "@prisma/client";
import { UserServices } from "../../services/user";
import { TweetServices } from "../../services/tweet";
  

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

}

const extraResolvers= {
    User: {
        tweets: async (_parent: User)=> {
            return await TweetServices.getTweetsById(_parent.id)
        }
    }
}


export const resolvers = {queries, mutations, extraResolvers}