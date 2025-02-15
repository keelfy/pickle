import { fetchApi } from "@/utils/api/server";
import { BatchCollectionItems, Collection, CollectionItem, Image, ImageSize, ModeratorProfile, PublicProfile } from "@/utils/api/types";
import { User } from "@supabase/supabase-js";

export async function fetchProfileByUser(user: User | null | undefined) {
    if (!user) return undefined;
    return fetchApi<PublicProfile>(`/v1/users/${user?.id}`);
}

export async function fetchMyProfile(avatarSize: ImageSize = 'md') {
    return fetchApi<PublicProfile>(`/v1/users/me?avatarSize=${avatarSize}`);
}

export async function fetchProfileByLink(link: string, avatarSize: ImageSize = 'lg') {
    return fetchApi<PublicProfile>(`/v1/profiles/${link}?avatarSize=${avatarSize}`);
}

export async function fetchProfileAvatar(profile: PublicProfile | undefined, size: ImageSize = 'md') {
    if (!profile) return undefined;
    return fetchApi<Image>(`/v1/users/${profile.id}/avatar?size=${size}`);
}

export async function fetchMyAvatar(size: ImageSize = 'md') {
    return fetchApi<Image>(`/v1/users/me/avatar?size=${size}`);
}

export async function fetchCollections(profile: PublicProfile) {
    return fetchApi<Collection[]>(`/v1/users/${profile.id}/collections`);
}

export async function fetchCollectionsItems(profile: PublicProfile, size: number = 10) {
    return fetchApi<BatchCollectionItems[]>(`/v1/users/${profile.id}/collections/items?size=${size}`);
}
