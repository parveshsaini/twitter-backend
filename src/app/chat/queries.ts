export const queries = `#graphql

    getUsersForSidebar: [User]

    getMessages(chattingUserId: ID!): [Message]
`