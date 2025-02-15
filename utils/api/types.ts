import { Paginated } from "./response";

export type ProfileCounts = {
    played: number;
    watched: number;
    ordered: number;
    followers: number;
}

export type Profile = {
    id: string;
    username: string;
    link: string;
    avatarUrl: string;
}

export type PublicProfile = Profile & {
    description: string | undefined;
    counts: ProfileCounts;
    isFollowing: boolean;
    isAuthorized: boolean;
}

export type ModeratorProfile = Profile & {
    addedAt: Date;
};

export type Image = {
    url: string | undefined;
}

export type ImagePreview = {
    previewId: string;
    previewUrl: string;
}

export type ImageSize = 'sm' | 'md' | 'lg';

export type ContentCategory = 'games' | 'movies' | 'video' | 'anime' | 'series' | 'custom';

export type Content = {
    id: string;
    name: string;
    category: ContentCategory;
}

export type GameNoteStatus = 'planned' | 'playing' | 'paused' | 'dropped' | 'finished' | 'skipped';

export type GameNote = {
    id: string;
    createdAt: Date;
    name: string;
    releaseDate?: Date;
    link?: string;
    rate?: number;
    comment?: string;
    status: GameNoteStatus;
    lastPlayedAt?: Date;
    initialOrdererId: string;
    initialOrdererUsername?: string;
    poster?: Partial<ImagePreview>;
    ordererCount: number;
};

export type Reaction = {
    emoteId: string;
    source: string;
    count: number;
    reactedByUser: boolean;
}

export type NoteReaction = {
    noteId: string;
    reactions: Reaction[];
}

export type Orderer = {
    id: string;
    userId: string;
    username: string;
    anonymous: boolean;
}

export type OrderStatus = 'pending' | 'approved' | 'rejected';

export type Order = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: Date;
    receiverId: string;
    category: ContentCategory;
    ordererId: string;
    ordererUsername: string;
    message: string;
    status: OrderStatus;
    amount: number;
    paymentType: number;
    updatedCategory: ContentCategory;
    updatedMessage: string;
};

export type OrderUpdate = Order & Partial<{
    contentCreated: boolean;
    contentId: string;
}>;

export type PosterPreview = {
    id: string;
    createdAt: Date;
    url: string;
}

export type Collection = {
    id: string;
    createdAt: Date;
    name: string;
    itemCount: number;
}

export type BatchCollectionItems = Paginated<CollectionItem> & {
    collectionId: string;
}

export type CollectionItem = {
    id: string;
    createdAt: Date;
    collectionId: string;
    posterUrl?: string;
    content: Content;
}
