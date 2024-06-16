import { Message } from "@prisma/client"
import { GraphqlContext, SendMessagePayload } from "../../interface"
import { ChatServices } from "../../services/chat"
import { UserServices } from "../../services/user"

const queries= {
    getMessages: async(
        _parent: any, 
        {chattingUserId}: {chattingUserId: string}, 
        ctx: GraphqlContext
    )=> {
        
        if(!ctx.user){
            throw new Error("Unauthorized")
        }

        const senderId= ctx.user.id
        const messages= await ChatServices.getMessagesService(senderId, chattingUserId)

        return messages
    },

    getUsersForSidebar: async (
        _parent: any, 
        _args: any, 
        ctx: GraphqlContext) => {
            
            //allows unauthorized access to all users

            // if(!ctx.user){
            //     throw new Error("Unauthorized")
            // }

            const users= await ChatServices.getUsersForSidebarService()

            return users
    }
    
}

const mutations = {
    sendMessage: async (
        _parent: any, 
        {payload}: {payload: SendMessagePayload}, 
        ctx: GraphqlContext) => {

                if(!ctx.user){
                    throw new Error("Unauthorized")
                }

                const body= payload.body
                const senderId= ctx.user.id

                if(!body) throw new Error("Body cannot be empty")
                
                const message= await ChatServices.sendMessageService(payload, senderId)

                return message
        }
}

const extraResolvers = {
    Message: {
        author: async (_parent: Message)=> {
            return await UserServices.getUserByIdService(_parent.senderId)
        }
    }
}

export const resolvers= {
    queries,
    mutations
}