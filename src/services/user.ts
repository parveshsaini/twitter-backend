import axios from "axios";
import { prismaClient } from "../clients/db";
import { jwtService } from "./jwt";

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

const verifyGoogleTokenService= async(token: string)=> {
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
}

const getCurrentUserService= async(id: string)=> {
    const user= await prismaClient.user.findUnique({
        where: {id}
    })

    if(!user){
        return null
    }

    return user
}

const getUserByIdService= async(id: string)=> {
    const user= await prismaClient.user.findUnique({
        where: {id}
    })

    if(!user){
        return null
    }

    return user
}

const followUserService= async(from: string, to: string)=> {
    await prismaClient.follows.create({
        data: {
            follower: { connect: { id: from} },
            following: { connect: { id: to } }
        }
    })
}

const unfollowUserService= async(from: string, to: string)=> {
    await prismaClient.follows.delete({
        where: {
            followerId_followingId: {
                followerId: from,
                followingId: to
            }
        }
    })
}

export const UserServices= {
    verifyGoogleTokenService, 
    getCurrentUserService, 
    getUserByIdService,
    followUserService,
    unfollowUserService
}