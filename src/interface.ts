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
    
export interface IGoogleTokenResponse {
    iss?: string;
    azp?: string;
    aud?: string;
    sub?: string;
    email: string;
    email_verified: string;
    nbf?: string;
    name?: string;
    picture?: string;
    given_name: string;
    family_name?: string;
    iat?: string;
    exp?: string;
    jti?: string;
    alg?: string;
    kid?: string;
    typ?: string;
  }
