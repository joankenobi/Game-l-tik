export interface Player {
    userId: string;
    uniqueId: string;
    nickname: string;
    profilePictureUrl: string;
    countryCode: string;
    contribution: number;
}

export interface Country {
    score: number;
    contributors: Set<string>;
}