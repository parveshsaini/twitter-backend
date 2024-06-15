import { prismaClient } from "../clients/db";
import { SendMessagePayload } from "../interface";

const sendMessageService= async(payload: SendMessagePayload, senderId: string)=>{
    const {recieverId, body} = payload
    try {
        let conversation= await prismaClient.conversation.findFirst({
            where: {
                participantsIds:{
                    hasEvery: [senderId, recieverId]
                }
            }
        })
    
        if (!conversation) {
            conversation = await prismaClient.conversation.create({
                data: {
                    participantsIds: {
                        set: [senderId, recieverId],
                    },
                },
            });
        }
    
        const newMessage = await prismaClient.message.create({
            data: {
                senderId,
                body,
                conversationId: conversation.id,
            },
        });
    
        //update convesation by adding message to it
        if (newMessage) {
            conversation = await prismaClient.conversation.update({
                where: {
                    id: conversation.id,
                },
                data: {
                    messages: {
                        connect: {
                            id: newMessage.id,
                        },
                    },
                },
            });
        }
    
        return newMessage

    } catch (error) {
        console.log('error sending mssg', error)
    }
}

const getUsersForSidebarService= async()=> {
    try {
        const users= await prismaClient.user.findMany()
        return users
    } catch (error) {
        console.log('error getting users for sidebar', error)
    }

}

const getMessagesService= async(senderId: string, recieverId: string)=>{
    try {
        const conversation= await prismaClient.conversation.findFirst({
            where: {
                participantsIds:{
                    hasEvery: [senderId, recieverId]
                }
            },
            include: {
				messages: {
					orderBy: {
						createdAt: "asc",
					},
				},
			},
        })

        if(!conversation){
            return []
        }


        return conversation.messages

    } catch (error) {
        console.log('error getting messages', error)
    }
}

export const ChatServices= {
    sendMessageService,
    getUsersForSidebarService,
    getMessagesService
}