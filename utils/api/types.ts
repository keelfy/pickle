type ProfileCounts = {
    played: number;
    watched: number;
    ordered: number;
}

type Profile = {
    id: string;
    createdAt: Date;
    username: string;
    link: string;
    description: string | undefined;
    counts?: ProfileCounts;
};

type Image = {
    url: string | undefined;
}

type ImagePreview = {
    previewId: string;
    previewUrl: string;
}

type ImageSize = 'sm' | 'md' | 'lg';

type ContentCategory = 'games' | 'movies' | 'video' | 'anime' | 'series' | 'custom';

type Content = {
    id: string;
    name: string;
    userId: string;
    category: ContentCategory;
}

type GameNoteStatus = 'planned' | 'playing' | 'paused' | 'dropped' | 'finished' | 'skipped';

type GameNote = {
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
};

type Orderer = {
    id: string;
    userId: string;
    username: string;
    anonymous: boolean;
}

type OrderStatus = 'pending' | 'approved' | 'rejected';

type Order = {
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
