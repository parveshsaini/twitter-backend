import { User } from "@prisma/client"
import jwt from "jsonwebtoken"

const generateToken = (user: User)=> {
    const payload= {
        id: user?.id,
        email: user?.email
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET!)
    console.log( process.env.JWT_SECRET)
    return token
}

export const jwtService= {generateToken}