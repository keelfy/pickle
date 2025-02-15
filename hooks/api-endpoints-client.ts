import { fetchApi } from "@/utils/api/client";
import { AddItemToCollectionReq, CreateCollectionReq, CreateOrderReq, UpdateCollectionReq } from "@/utils/api/request";
import { ContentSearchHits, LinkValidation, Paginated } from "@/utils/api/response";
import { Collection, CollectionItem, GameNote, Image, ImagePreview, ImageSize, ModeratorProfile, NoteReaction, Order, OrderUpdate, Profile, PublicProfile, Reaction } from "@/utils/api/types";


export async function uploadAvatarForPreview(formData: FormData) {
    return fetchApi<ImagePreview>(`/v1/users/me/avatar`, true, {
        method: "POST",
        body: formData,
    });
}

export async function validateProfileLink(link: string) {
    return fetchApi<LinkValidation>(`/v1/profiles/validate-link?link=${link}`);
}

export async function updateMyProfile(data: Partial<PublicProfile>) {
    return fetchApi<PublicProfile>(`/v1/users/me`, true, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function fetchMyAvatar(size: ImageSize = 'md') {
    return fetchApi<Image>(`/v1/users/me/avatar?size=${size}`);
}

export async function fetchProfileOrders(profile: Profile, cursor: string, column: string, limit: number, direction: 'asc' | 'desc' = 'desc') {
    return fetchApi<Order[]>(`/v1/users/${profile.id}/orders?cursor=${cursor}&column=${column}&limit=${limit}&direction=${direction}`);
}

export async function uploadPosterPreview(profile: Profile | undefined, formData: FormData, size: ImageSize = 'md') {
    if (!profile) return undefined;
    return fetchApi<ImagePreview>(`/v1/users/${profile.id}/posters/previews?size=${size}`, true, {
        method: "POST",
        body: formData,
    });
}

export async function deletePosterPreview(profile: PublicProfile | undefined, id: string) {
    if (!profile) return undefined;
    return fetchApi(`/v1/users/${profile.id}/posters/previews/${id}`, true, {
        method: "DELETE",
    });
}

export async function fetchProfileGameNotes(profile: PublicProfile, params: URLSearchParams) {
    return fetchApi<GameNote[]>(`/v1/users/${profile.id}/game-notes?${params.toString()}`);
}

export async function fetchGameNotePoster(profile: PublicProfile, gameNoteId: string, size: ImageSize = 'sm') {
    return fetchApi<Image>(`/v1/users/${profile.id}/game-notes/${gameNoteId}/posters?size=${size}`);
}

export async function fetchGameNote(profile: PublicProfile, gameNoteId: string) {
    return fetchApi<GameNote>(`/v1/users/${profile.id}/game-notes/${gameNoteId}`);
}

export async function updateGameNote(profile: PublicProfile, gameNoteId: string, gameNote: Partial<GameNote>) {
    return fetchApi<GameNote>(`/v1/users/${profile.id}/game-notes/${gameNoteId}`, true, {
        method: "PATCH",
        body: JSON.stringify(gameNote),
    });
}

export async function fetchGameNoteOrders(profile: PublicProfile, gameNoteId: string, page: number, size: number) {
    return fetchApi<Paginated<Order>>(`/v1/users/${profile.id}/game-notes/${gameNoteId}/orders?page=${page}&size=${size}`);
}

export async function fetchContentSearch(profile: PublicProfile | undefined, query: string, page: number, size: number) {
    if (!profile) return undefined;
    return fetchApi<ContentSearchHits>(`/v1/users/${profile.id}/content?query=${query}&page=${page}&size=${size}`);
}

export async function fetchOrderById(profile: PublicProfile | undefined, orderId: string) {
    if (!profile) return undefined;
    return fetchApi<Order>(`/v1/users/${profile.id}/orders/${orderId}`);
}

export async function createOrder(profile: PublicProfile, order: CreateOrderReq) {
    return fetchApi<Order>(`/v1/users/${profile.id}/orders`, true, {
        method: "POST",
        body: JSON.stringify(order),
    });
}

export async function updateOrder(profile: PublicProfile | undefined, orderId: string, order: any) {
    if (!profile) return undefined;
    return fetchApi<OrderUpdate>(`/v1/users/${profile.id}/orders/${orderId}`, true, {
        method: "PATCH",
        body: JSON.stringify(order),
    });
}

export async function deleteContent(profile: PublicProfile | undefined, path: string, id: string, resetApprovedOrders: boolean = true) {
    if (!profile) return undefined;
    return fetchApi(`/v1/users/${profile.id}/${path}/${id}?resetApprovedOrders=${resetApprovedOrders}`, true, {
        method: "DELETE",
    });
}

export async function followProfile(profile: PublicProfile | undefined) {
    if (!profile) return undefined;
    return fetchApi(`/v1/users/${profile.id}/follows`, true, {
        method: "POST",
    });
}

export async function unfollowProfile(profile: PublicProfile | undefined) {
    if (!profile) return undefined;
    return fetchApi(`/v1/users/${profile.id}/follows`, true, {
        method: "DELETE",
    });
}

export async function fetchGameNoteReactions(profile: PublicProfile, gameNoteId: string) {
    return fetchApi<Reaction[]>(`/v1/users/${profile.id}/game-notes/${gameNoteId}/reactions`);
}

export async function fetchBatchGameNoteReactions(profile: PublicProfile, gameNoteIds: string[]) {
    if (gameNoteIds.length === 0) return [];
    return fetchApi<NoteReaction[]>(`/v1/users/${profile.id}/game-notes/reactions?noteIds=${gameNoteIds.join(',')}`);
}

export async function createGameNoteReaction(profile: PublicProfile | undefined, gameNoteId: string, emote: string) {
    if (!profile) return undefined;
    const body = {
        emoteId: emote,
        source: 'unicode_emoji',
    }
    return fetchApi(`/v1/users/${profile.id}/game-notes/${gameNoteId}/reactions`, true, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function deleteGameNoteReaction(profile: PublicProfile | undefined, gameNoteId: string, emoteId: string) {
    if (!profile) return undefined;
    const body = {
        emoteId: emoteId,
        source: 'unicode_emoji',
    }
    return fetchApi(`/v1/users/${profile.id}/game-notes/${gameNoteId}/reactions`, true, {
        method: "DELETE",
        body: JSON.stringify(body),
    });
}

export async function fetchCreateCollection(profile: PublicProfile, collection: CreateCollectionReq) {
    return fetchApi<Collection>(`/v1/users/${profile.id}/collections`, true, {
        method: "POST",
        body: JSON.stringify(collection),
    });
}

export async function fetchUpdateCollection(collectionId: string, collection: UpdateCollectionReq) {
    return fetchApi<Collection>(`/v1/collections/${collectionId}`, true, {
        method: "PATCH",
        body: JSON.stringify(collection),
    });
}

export async function fetchDeleteCollection(collectionId: string) {
    return fetchApi(`/v1/collections/${collectionId}`, true, {
        method: "DELETE",
    });
}

export async function fetchAddCollectionItem(collectionId: string, req: AddItemToCollectionReq) {
    return fetchApi<CollectionItem>(`/v1/collections/${collectionId}/items`, true, {
        method: "POST",
        body: JSON.stringify(req),
    });
}

export async function fetchDeleteCollectionItem(collectionId: string, itemId: string) {
    return fetchApi(`/v1/collections/${collectionId}/items/${itemId}`, true, {
        method: "DELETE",
    });
}

export async function fetchCollectionItems(collectionId: string, page: number, size: number = 10) {
    return fetchApi<Paginated<CollectionItem>>(`/v1/collections/${collectionId}/items?page=${page}&size=${size}`);
}

export async function fetchModeratorProfiles(profile: PublicProfile) {
    return fetchApi<ModeratorProfile[]>(`/v1/users/${profile.id}/moderators`);
}

export async function fetchAddModerator(profile: PublicProfile, userLink: string) {
    return fetchApi<ModeratorProfile>(`/v1/users/${profile.id}/moderators`, true, {
        method: "POST",
        body: JSON.stringify({ userLink }),
    });
}

export async function fetchDeleteModerator(profile: PublicProfile, moderatorId: string) {
    return fetchApi<void>(`/v1/users/${profile.id}/moderators/${moderatorId}`, true, {
        method: "DELETE",
    });
}
