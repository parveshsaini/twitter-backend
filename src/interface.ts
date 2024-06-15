export interface JWTUser {
    id: string,
    email: string
}

export interface GraphqlContext{
    user?: JWTUser
}

export interface CreateTweetPayload {
    content: string;
    imageUrl?: string;
}
export interface SendMessagePayload {
    body: string;
    recieverId: string;
}
    
