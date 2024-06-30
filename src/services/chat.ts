import { prismaClient } from "../clients/db";
import { produceMessage } from "../clients/kafka";
import { SendMessagePayload } from "../interface";
import { getReceiverSocketId, io } from "../socket/socket";

const sendMessageService = async (payload: SendMessagePayload, senderId: string) => {
    const { recieverId, body } = payload;
    try {  

        let conversation = await prismaClient.conversation.findFirst({
            where: {
                participantsIds: {
                    hasEvery: [senderId, recieverId]
                }
            }
        });

        if (!conversation) {
            conversation = await prismaClient.conversation.create({
                data: {
                    participantsIds: {
                        set: [senderId, recieverId],
                    },
                },
            });
        }

        // Step 2: Create the new message in the database
        const newMessage = await prismaClient.message.create({
            data: {
                senderId,
                body,
                conversationId: conversation.id,
            },
        });

        // Update conversation by adding the message to it
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


        return newMessage;

    } catch (error) {
        console.log('error sending message', error);
    }
};


// const sendMessageService= async(payload: SendMessagePayload, senderId: string)=>{
//     const {recieverId, body} = payload
//     try {
//         let conversation= await prismaClient.conversation.findFirst({
//             where: {
//                 participantsIds:{
//                     hasEvery: [senderId, recieverId]
//                 }
//             }
//         })
    
//         if (!conversation) {
//             conversation = await prismaClient.conversation.create({
//                 data: {
//                     participantsIds: {
//                         set: [senderId, recieverId],
//                     },
//                 },
//             });
//         }
    
//         const newMessage = await prismaClient.message.create({
//             data: {
//                 senderId,
//                 body,
//                 conversationId: conversation.id,
//             },
//         });
    
//         //update convesation by adding message to it
//         if (newMessage) {
//             conversation = await prismaClient.conversation.update({
//                 where: {
//                     id: conversation.id,
//                 },
//                 data: {
//                     messages: {
//                         connect: {
//                             id: newMessage.id,
//                         },
//                     },
//                 },
//             });
//         }

//         const receiverSocketId = getReceiverSocketId(recieverId);

// 		if (receiverSocketId) {
// 			io.to(receiverSocketId).emit("newMessage", newMessage);
// 		}
    
//         return newMessage

//     } catch (error) {
//         console.log('error sending mssg', error)
//     }
// }

const getUsersForSidebarService= async()=> {
    try {
        const users= await prismaClient.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImageUrl: true                
            }
        })
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
                    include:{
                        sender: true
                    }
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