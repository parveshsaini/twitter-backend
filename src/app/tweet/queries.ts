export const queries= `#graphql
    getAllTweets: [Tweet]

    getTweetsById(id: String): [Tweet]

    getSignedUrl(imageName: String, imageType: String): String
`