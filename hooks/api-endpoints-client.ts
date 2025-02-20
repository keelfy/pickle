import { fetchApi } from "@/utils/api/client";
import { AddItemToCollectionReq, CreateCollectionReq, CreateOrderReq, UpdateCollectionReq } from "@/utils/api/request";
import { ContentSearchHits, LinkValidation, Paginated } from "@/utils/api/response";
import { Collection, CollectionItem, ContentCategory, ContentNote, ContentNoteSearchResult, GameNote, Image, ImagePreview, ImageSize, ModeratorProfile, NoteReaction, Order, OrderUpdate, Profile, PublicProfile, Reaction, SuggestionPreferences } from "@/utils/api/types";

// Profile

export async function validateProfileLink(link: string) {
    return fetchApi<LinkValidation>(`/v1/profiles/validate-link?link=${link}`);
}

export async function updateMyProfile(data: Partial<PublicProfile>) {
    return fetchApi<void>(`/v1/users/me`, true, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function updateSuggestionPreferences(data: SuggestionPreferences) {
    return fetchApi<void>(`/v1/users/me/suggestion-preferences`, true, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

// Profile Avatar

export async function uploadAvatarForPreview(formData: FormData) {
    return fetchApi<ImagePreview>(`/v1/users/me/avatar`, true, {
        method: "POST",
        body: formData,
    });
}

export async function fetchMyAvatar(size: ImageSize = 'md') {
    return fetchApi<Image>(`/v1/users/me/avatar?size=${size}`);
}

// Profile Search

export async function fetchContentSearch(profile: PublicProfile | undefined, query: string, page: number, size: number) {
    if (!profile) return undefined;
    return fetchApi<ContentSearchHits>(`/v1/users/${profile.id}/content?query=${query}&page=${page}&size=${size}`);
}

// Poster Previews

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

// Orders

export async function fetchProfileOrders(profile: Profile, cursor: string, column: string, limit: number, direction: 'asc' | 'desc' = 'desc') {
    return fetchApi<Order[]>(`/v1/users/${profile.id}/orders?cursor=${cursor}&column=${column}&limit=${limit}&direction=${direction}`);
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

// Follows

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

// Collections

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

// Moderators

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

// Content Notes

export async function fetchProfileContentNotes<T extends ContentNoteSearchResult>(profile: PublicProfile, category: ContentCategory, params: URLSearchParams) {
    return fetchApi<T[]>(`/v1/users/${profile.id}/content-notes/${category}?${params.toString()}`);
}

export async function fetchContentNotePoster(profile: PublicProfile, category: ContentCategory, noteId: string, size: ImageSize = 'sm') {
    return fetchApi<Image>(`/v1/users/${profile.id}/content-notes/${category}/${noteId}/posters?size=${size}`);
}

export async function fetchContentNote<T extends ContentNote>(profile: PublicProfile, category: ContentCategory, noteId: string) {
    return fetchApi<T>(`/v1/users/${profile.id}/content-notes/${category}/${noteId}`);
}

export async function deleteContentNote(profile: PublicProfile, category: ContentCategory, noteId: string, resetApprovedOrders: boolean = true) {
    return fetchApi(`/v1/users/${profile.id}/content-notes/${category}/${noteId}?resetApprovedOrders=${resetApprovedOrders}`, true, {
        method: "DELETE",
    });
}

export async function updateContentNote<T extends ContentNote>(profile: PublicProfile, category: ContentCategory, noteId: string, note: any) {
    return fetchApi<T>(`/v1/users/${profile.id}/content-notes/${category}/${noteId}`, true, {
        method: "PATCH",
        body: JSON.stringify(note),
    });
}

export async function fetchRenameContentNote(profile: Profile, category: ContentCategory, id: string, name: string) {
    return fetchApi<void>(`/v1/users/${profile.id}/content-notes/${category}/${id}/name`, true, {
        method: "PATCH",
        body: JSON.stringify({ name }),
    });
}

export async function fetchContentNoteOrders(profile: Profile, category: ContentCategory, noteId: string, page: number, size: number) {
    return fetchApi<Paginated<Order>>(`/v1/users/${profile.id}/content-notes/${category}/${noteId}/orders?page=${page}&size=${size}`);
}

export async function fetchContentNoteReactions(profile: Profile, category: ContentCategory, noteId: string) {
    return fetchApi<Reaction[]>(`/v1/users/${profile.id}/content-notes/${category}/${noteId}/reactions`);
}

export async function fetchBatchContentNoteReactions(profile: Profile, category: ContentCategory, noteIds: string[]) {
    if (noteIds.length === 0) return [];
    return fetchApi<NoteReaction[]>(`/v1/users/${profile.id}/content-notes/${category}/reactions?noteIds=${noteIds.join(',')}`);
}

export async function createContentNoteReaction(profile: Profile, category: ContentCategory, noteId: string, emote: string) {
    const body = {
        emoteId: emote,
        source: 'unicode_emoji',
    }
    return fetchApi(`/v1/users/${profile.id}/content-notes/${category}/${noteId}/reactions`, true, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function deleteContentNoteReaction(profile: Profile, category: ContentCategory, noteId: string, emoteId: string) {
    const body = {
        emoteId: emoteId,
        source: 'unicode_emoji',
    }
    return fetchApi(`/v1/users/${profile.id}/content-notes/${category}/${noteId}/reactions`, true, {
        method: "DELETE",
        body: JSON.stringify(body),
    });
}
