type Profile = {
    id: string;
    createdAt: Date;
    username: string;
    link: string;
    description: string | undefined;
};

type ProfileAvatar = {
    url: string | null;
    width: number;
    height: number;
}

type ProfileAvatarPreview = {
    previewUrl: string;
}

type Content = {
    id: string;
    name: string;
    userId: string;
    category: number;
}

type GameNote = {
    id: string;
    createdAt: Date;
    name: string;
    releaseDate?: Date;
    link?: string;
    rate?: number;
    comment?: string;
    status: number;
    completionStatus: number;
    completionDate?: Date;
};

type Orderer = {
    id: string;
    userId: string;
    username: string;
    anonymous: boolean;
}

type Order = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: Date;
    receiverId: string;
    category: number;
    ordererId: string;
    ordererUsername: string;
    message: string;
    status: number;
    amount: number;
    paymentType: number;
};
