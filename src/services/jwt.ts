import { User } from "@prisma/client"
import jwt from "jsonwebtoken"
import { JWTUser } from "../interface"
import { logger } from ".."

const generateToken = (user: User)=> {
    const payload: JWTUser= {
        id: user?.id,
        email: user?.email
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET!)
    // console.log( process.env.JWT_SECRET)
    return token
}

const decodeToken= (token: string)=> {
   try {
     const decoded= jwt.verify(token, process.env.JWT_SECRET!) as JWTUser
 
     if(!decoded){
         throw new Error('Invalid token')
     }
 
     return decoded

   } catch (error) {
    logger.error(`Error decoding token: ${error}`)
    return null
    //  throw new Error(`backend error: ${error}`)
   }
    
}

export const jwtService= {generateToken, decodeToken}