import { fetchApi } from "@/utils/api/server";
import { BatchCollectionItems, Collection, CollectionItem, Image, ImageSize, Profile } from "@/utils/api/types";
import { User } from "@supabase/supabase-js";

export async function fetchProfileByUser(user: User | null | undefined) {
    if (!user) return undefined;
    return fetchApi<Profile>(`/v1/users/${user?.id}`);
}

export async function fetchMyProfile() {
    return fetchApi<Profile>(`/v1/users/me`);
}

export async function fetchProfileByLink(link: string) {
    return fetchApi<Profile>(`/v1/profiles/${link}`);
}

export async function fetchProfileAvatar(profile: Profile | undefined, size: ImageSize = 'md') {
    if (!profile) return undefined;
    return fetchApi<Image>(`/v1/users/${profile.id}/avatar?size=${size}`);
}

export async function fetchMyAvatar(size: ImageSize = 'md') {
    return fetchApi<Image>(`/v1/users/me/avatar?size=${size}`);
}

export async function fetchCollections(profile: Profile) {
    return fetchApi<Collection[]>(`/v1/users/${profile.id}/collections`);
}

export async function fetchCollectionsItems(profile: Profile, size: number = 10) {
    return fetchApi<BatchCollectionItems[]>(`/v1/users/${profile.id}/collections/items?size=${size}`);
}
