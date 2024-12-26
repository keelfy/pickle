type Profile = {
    id: string;
    createdAt: Date;
    username: string;
    link: string;
};

type GameNote = {
    id: string;
    createdAt: Date;
    name: string;
    rate: number;
    comment: string;
    status: number;
    completionStatus: number;
    completionDate: Date;
};

type Order = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: Date;
    receiverId: string;
    categoryType: number;
    orderedBy: string;
    ordererUsername: string;
    message: string;
    status: number;
    amount: number;
    paymentType: number;
};
