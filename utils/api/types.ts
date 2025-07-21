import { Paginated } from "./response";

export type ProfileCounts = {
    played: number;
    watched: number;
    ordered: number;
    followers: number;
}

export type Profile = {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string;
}

export type PublicProfile = Profile & {
    description: string | undefined;
    counts: ProfileCounts;
    isFollowing: boolean;
    isAuthorized: boolean;
    suggestionPreferences: SuggestionPreferences;
    connections?: Connections;
}

export type Connections = {
    twitch: TwitchConnection;
}

export type TwitchConnection = {
    connected: boolean;
    login?: string;
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
    Custom = 'custom',
    Any = 'any',
}

export type ContentCategory = `${ContentCategoryEnum}`;

export const CONTENT_CATEGORIES: ContentCategory[] = Object.values(ContentCategoryEnum);

export type Content = {
    id: string;
    title: string;
    releaseDate?: Date;
    websites: ContentWebsite[];
    category: ContentCategory;
    coverUrl: string;
    sourceUrl?: string;
    sourceType: string;
}

export interface ContentNote {
    id: string;
    createdAt: Date;
    status: ContentNoteStatus;
    rate?: number;
    comment?: string;
    content: Content;
}

export type GameNoteStatus = 'planned' | 'playing' | 'paused' | 'dropped' | 'finished' | 'skipped';

export type MovieNoteStatus = 'planned' | 'dropped' | 'watched' | 'skipped';

export type ContentNoteStatus = GameNoteStatus | MovieNoteStatus;

export type GameNote = ContentNote & {
    status: GameNoteStatus;
    lastPlayedAt?: Date;
    content: Game;
};

export type MovieNote = ContentNote & {
    status: MovieNoteStatus;
    watchedAt?: Date;
    content: Movie;
}

export interface ContentNoteSearchResult extends ContentNote {
    title: string;
    coverUrl: string;
    status: ContentNoteStatus;
    initialOrdererUserId?: string;
    initialOrdererDisplayName?: string;
    ordererCount: number;
}

export type GameNoteSearchResult = ContentNoteSearchResult & {
    lastPlayedAt?: Date;
    releaseDate?: Date;
}

export type MovieNoteSearchResult = ContentNoteSearchResult & {
    watchedAt?: Date;
    releaseDate?: Date;
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
    displayName: string;
    source: string;
    referenceUserId: string;
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
    ordererDisplayName: string;
    message: string;
    status: OrderStatus;
    amount: number;
    paymentType: number;
    source: string;
    reference: string;
    anonymous: boolean;
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
    coverUrl?: string;
    content: Content;
}

export type TwitchChannelReward = {
    id: string;
    title: string;
    prompt: string;
    backgroundColor: string;
    cost: number;
    isEnabled: boolean;
    isPaused: boolean;
    isInStock: boolean;
    isUserInputRequired: boolean;
    category: ContentCategory | undefined;
}

export type BroadcasterRewardPreferences = {
    isActive: boolean;
    trackedRewards: TwitchChannelReward[];
    availableRewards: TwitchChannelReward[];
}

export type BroadcasterPreferences = {
    rewards: BroadcasterRewardPreferences;
}

export type ExternalSearchResult = {
    title: string;
    thumbnailUrl: string;
    isNoted: boolean;
}

export type ContentWebsite = {
    url: string;
    type: string;
}

export type Game = {
    id: string;
    externalId: string;
    title: string;
    releaseDate?: Date;
    websites: ContentWebsite[];
    coverUrl?: string;
    sourceUrl?: string;
    sourceType: string;
}

export type Movie = {
    id: string;
    externalId: string;
    title: string;
    releaseDate?: Date;
    websites: ContentWebsite[];
    coverUrl?: string;
    sourceUrl?: string;
    sourceType: string;
}