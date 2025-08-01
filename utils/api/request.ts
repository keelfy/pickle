import { Collection, ContentCategory } from "./types";

export type GameNoteReq = {
	status: string;
	rate?: number;
	comment?: string;
	contentId: string;
}

export type CreateContentNoteReq = {
	status: string;
	rate?: number;
	comment?: string;
	contentId: string;
}

export type CreateGameNoteReq = CreateContentNoteReq & {
	lastPlayedAt?: Date;
}

export type CreateMovieNoteReq = CreateContentNoteReq & {
	watchedAt?: Date;
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

export type TrackedRewardReq = {
	rewardId: string;
	category: ContentCategory | 'any';
}

export type BroadcasterPreferencesReq = {
	rewards: {
		trackedRewards: TrackedRewardReq[];
	}
}