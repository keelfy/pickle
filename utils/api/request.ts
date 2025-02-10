export type CreateOrderReq = {
	receiverLink: string;
	paymentType: number;
	amount: number
	orderedBy: string;
	categoryType: number;
	message: string;
}

export type GameNoteReq = {
	name: string
	link: string
	releaseDate: string
	rate: number
	comment: string
	ordered: boolean
	status: number
}

export type CreateGameNoteReq = {
	userLink: string;
	gameNote: GameNoteReq;
	initialOrderId: string;
}

export type CreateCollectionReq = {
	name: string;
}
