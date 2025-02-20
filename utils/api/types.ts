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
    suggestionPreferences: SuggestionPreferences;
}

export type SuggestionPreferences = {
    enabled: boolean;
    allowedFree: boolean;
    allowedAnonymously: boolean;
    categories: ContentCategory[];
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

export enum ContentCategoryEnum {
    Games = 'games',
    Movies = 'movies',
    Anime = 'anime',
    Series = 'series',
    Video = 'video',
}

export type ContentCategory = `${ContentCategoryEnum}`;

export const CONTENT_CATEGORIES: ContentCategory[] = Object.values(ContentCategoryEnum);

export type Content = {
    id: string;
    name: string;
    category: ContentCategory;
}

export interface ContentNote {
    id: string;
    createdAt: Date;
    name: string;
    rate?: number;
    comment?: string;
    posterUrl: string;
}

export type GameNoteStatus = 'planned' | 'playing' | 'paused' | 'dropped' | 'finished' | 'skipped';

export type MovieNoteStatus = 'planned' | 'dropped' | 'watched' | 'skipped';

export type ContentNoteStatus = GameNoteStatus | MovieNoteStatus;

export type GameNote = ContentNote & {
    releaseDate?: Date;
    link?: string;
    status: GameNoteStatus;
    lastPlayedAt?: Date;
    poster?: Partial<ImagePreview>;
    posterUrl: string;
};

export type MovieNote = ContentNote & {
    releaseDate?: Date;
    status: MovieNoteStatus;
    watchedAt?: Date;
}

export interface ContentNoteSearchResult extends ContentNote {
    status: GameNoteStatus;
    initialOrdererUsername?: string;
    ordererCount: number;
}

export type GameNoteSearchResult = ContentNoteSearchResult & {
    releaseDate?: Date;
    lastPlayedAt?: Date;
}

export type MovieNoteSearchResult = ContentNoteSearchResult & {
    releaseDate?: Date;
    watchedAt?: Date;
}

export type Reaction = {
    emoteId: string;
    source: string;
    count: number;
    userReacted: boolean;
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
