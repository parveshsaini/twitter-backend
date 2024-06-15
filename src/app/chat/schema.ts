export const types = `#graphql
    input SendMessageInput {
        body: String!
        recieverId: ID!
    }

    type Conversation {
        id: ID!
        
        participants: [User]

        messages: [Message]
    }

    type Message {
        id: ID!

        body: String!

        createdAt: String
        updatedAt: String

        conversation: Conversation

        sender: User
    }
`