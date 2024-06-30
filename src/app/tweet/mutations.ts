export const mutations= `#graphql
    createTweet(payload: CreateTweetInput!): Tweet

    deleteTweet(id: String!): Boolean
`