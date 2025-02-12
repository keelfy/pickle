import { Collection, ContentCategory } from "./types";

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

export type UpdateCollectionReq = Partial<Collection>;

export type AddItemToCollectionReq = {
	noteId: string;
	category: ContentCategory;
}

export type CreateOrderReq = {
	ordererUsername: string;
	isAnonymously: boolean;
	category: ContentCategory;
	message: string;
}