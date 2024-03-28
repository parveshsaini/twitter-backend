import axios from "axios"
import { prismaClient } from "../../clients/db";
import { jwtService } from "../../services/jwt";
import { GraphqlContext } from "../../interface";
import { User } from "@prisma/client";

interface IGoogleToekenResponse {
    iss?: string;
    azp?: string;
    aud?: string;
    sub?: string;
    email: string;
    email_verified: string;
    nbf?: string;
    name?: string;
    picture?: string;
    given_name: string;
    family_name?: string;
    iat?: string;
    exp?: string;
    jti?: string;
    alg?: string;
    kid?: string;
    typ?: string;
  }
  

const queries = {
    verifyGoogleToken: async (_parent: any, {token}: {token: string}) =>{
        const googleToken= token
        const googleOAuthUrl= new URL('https://oauth2.googleapis.com/tokeninfo')

        googleOAuthUrl.searchParams.append('id_token', googleToken)

        const { data }= await axios.get<IGoogleToekenResponse>(googleOAuthUrl.toString(), {
            responseType: 'json'
        })

        const existingUser= await prismaClient.user.findUnique({
            where: {
                email: data.email
            }
        })
        
        //if user does not exist,  create one
        if(!existingUser){
            await prismaClient.user.create({
                data: {
                    email: data.email,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    profileImageUrl: data.picture
                }
            })
        }

        const userInDb= await prismaClient.user.findUnique({
            where: {
                email: data.email
            }
        })

        if(!userInDb){
            throw new Error('User not found')
        }

        const jwtToken= jwtService.generateToken(userInDb)

        return jwtToken
    },

    getCurrentUser: async(_parent: any, args: any, ctx: GraphqlContext)=> {
        const id =  ctx.user?.id

        if(!id) return null

        const user= await prismaClient.user.findUnique({
            where: {id}
        })

        return user
    },

}

const mutations= {

}

const extraResolvers= {
    User: {
        tweets: async (_parent: User)=> {
            return await prismaClient.tweet.findMany({
                where: {
                    authorId: _parent.id
                }
            })
        }
    }
}


export const resolvers = {queries, mutations, extraResolvers}