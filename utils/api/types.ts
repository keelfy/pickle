type UserDetails = {
    id: string;
    createAt: Date;
    username: string;
};

type GameNote = {
    id: number;
    createdAt: Date;
    gameName: string;
    comment: string;
    rate: number;
    status: number;
    finishedAt: string;
};

type Order = {
    id: number;
    createdAt: Date;
    serialNumber: number;
    categoryType: string;
    orderedBy: number;
    ordererUsername: string;
    message: string;
    receiver: string;
    status: string;
    amount: number;
    paymentType: string;
};
