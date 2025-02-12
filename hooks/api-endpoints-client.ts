import { fetchApi } from "@/utils/api/client";
import { AddItemToCollectionReq, CreateCollectionReq, CreateOrderReq, UpdateCollectionReq } from "@/utils/api/request";
import { ContentSearchHits, LinkValidation, Paginated } from "@/utils/api/response";
import { Collection, CollectionItem, Content, GameNote, Image, ImagePreview, ImageSize, NoteReaction, Order, OrderUpdate, Profile, Reaction } from "@/utils/api/types";


export async function uploadAvatarForPreview(formData: FormData) {
    return fetchApi<ImagePreview>(`/v1/users/me/avatar`, true, {
        method: "POST",
        body: formData,
    });
}

export async function validateProfileLink(link: string) {
    return fetchApi<LinkValidation>(`/v1/profiles/validate-link?link=${link}`);
}

export async function updateMyProfile(data: Partial<Profile>) {
    return fetchApi<Profile>(`/v1/users/me`, true, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function fetchProfileOrders(profile: Profile | undefined, cursor: string, column: string, limit: number, direction: 'asc' | 'desc' = 'desc') {
    if (!profile) return undefined;
    return fetchApi<Order[]>(`/v1/users/${profile.id}/orders?cursor=${cursor}&column=${column}&limit=${limit}&direction=${direction}`);
}

export async function uploadPosterPreview(profile: Profile | undefined, formData: FormData, size: ImageSize = 'md') {
    if (!profile) return undefined;
    return fetchApi<ImagePreview>(`/v1/users/${profile.id}/posters/previews?size=${size}`, true, {
        method: "POST",
        body: formData,
    });
}

export async function deletePosterPreview(profile: Profile | undefined, id: string) {
    if (!profile) return undefined;
    return fetchApi(`/v1/users/${profile.id}/posters/previews/${id}`, true, {
        method: "DELETE",
    });
}

export async function fetchProfileGameNotes(profile: Profile, params: URLSearchParams) {
    return fetchApi<GameNote[]>(`/v1/users/${profile.id}/game-notes?${params.toString()}`);
}

export async function fetchGameNotePoster(profile: Profile, gameNoteId: string, size: ImageSize = 'sm') {
    return fetchApi<Image>(`/v1/users/${profile.id}/game-notes/${gameNoteId}/posters?size=${size}`);
}

export async function fetchGameNote(profile: Profile, gameNoteId: string) {
    return fetchApi<GameNote>(`/v1/users/${profile.id}/game-notes/${gameNoteId}`);
}

export async function updateGameNote(profile: Profile, gameNoteId: string, gameNote: Partial<GameNote>) {
    return fetchApi<GameNote>(`/v1/users/${profile.id}/game-notes/${gameNoteId}`, true, {
        method: "PATCH",
        body: JSON.stringify(gameNote),
    });
}

export async function fetchGameNoteOrders(profile: Profile | undefined, gameNoteId: string, cursor: string, limit: number, direction: 'asc' | 'desc' = 'desc') {
    if (!profile) return undefined;
    return fetchApi<Paginated<Order>>(`/v1/users/${profile.id}/game-notes/${gameNoteId}/orders?cursor=${cursor}&limit=${limit}&direction=${direction}`);
}

export async function fetchContentSearch(profile: Profile | undefined, query: string, page: number, size: number) {
    if (!profile) return undefined;
    return fetchApi<ContentSearchHits>(`/v1/users/${profile.id}/content?query=${query}&page=${page}&size=${size}`);
}

export async function fetchOrderById(profile: Profile | undefined, orderId: string) {
    if (!profile) return undefined;
    return fetchApi<Order>(`/v1/users/${profile.id}/orders/${orderId}`);
}

export async function createOrder(profile: Profile, order: CreateOrderReq) {
    return fetchApi<Order>(`/v1/users/${profile.id}/orders`, true, {
        method: "POST",
        body: JSON.stringify(order),
    });
}

export async function updateOrder(profile: Profile | undefined, orderId: string, order: any) {
    if (!profile) return undefined;
    return fetchApi<OrderUpdate>(`/v1/users/${profile.id}/orders/${orderId}`, true, {
        method: "PATCH",
        body: JSON.stringify(order),
    });
}

export async function deleteContent(profile: Profile | undefined, path: string, id: string, resetApprovedOrders: boolean = true) {
    if (!profile) return undefined;
    return fetchApi(`/v1/users/${profile.id}/${path}/${id}?resetApprovedOrders=${resetApprovedOrders}`, true, {
        method: "DELETE",
    });
}

export async function followProfile(profile: Profile | undefined) {
    if (!profile) return undefined;
    return fetchApi(`/v1/users/${profile.id}/follows`, true, {
        method: "POST",
    });
}

export async function unfollowProfile(profile: Profile | undefined) {
    if (!profile) return undefined;
    return fetchApi(`/v1/users/${profile.id}/follows`, true, {
        method: "DELETE",
    });
}

export async function fetchGameNoteReactions(profile: Profile, gameNoteId: string) {
    return fetchApi<Reaction[]>(`/v1/users/${profile.id}/game-notes/${gameNoteId}/reactions`);
}

export async function fetchBatchGameNoteReactions(profile: Profile, gameNoteIds: string[]) {
    if (gameNoteIds.length === 0) return [];
    return fetchApi<NoteReaction[]>(`/v1/users/${profile.id}/game-notes/reactions?noteIds=${gameNoteIds.join(',')}`);
}

export async function createGameNoteReaction(profile: Profile | undefined, gameNoteId: string, emote: string) {
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

export async function deleteGameNoteReaction(profile: Profile | undefined, gameNoteId: string, emoteId: string) {
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

export async function fetchCreateCollection(profile: Profile, collection: CreateCollectionReq) {
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
