import { User } from "@prisma/client"
import jwt from "jsonwebtoken"
import { JWTUser } from "../interface"

const generateToken = (user: User)=> {
    const payload: JWTUser= {
        id: user?.id,
        email: user?.email
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET!)
    console.log( process.env.JWT_SECRET)
    return token
}

const decodeToken= (token: string)=> {
    const decoded= jwt.verify(token, process.env.JWT_SECRET!) as JWTUser

    if(!decoded){
        throw new Error('Invalid token')
    }

    return decoded
    
}

export const jwtService= {generateToken, decodeToken}