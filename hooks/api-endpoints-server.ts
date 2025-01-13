import { fetchApi } from "@/utils/api/server";
import { User } from "@supabase/supabase-js";

export async function getProfileByUser(user: User | null): Promise<Profile | undefined> {
    return fetchApi<Profile>(`/v1/users/${user?.id}`);
}

export async function getMyProfile(): Promise<Profile | undefined> {
    return fetchApi<Profile>(`/v1/profiles/me`, true);
}

export async function getProfileByLink(link: string): Promise<Profile | undefined> {
    return fetchApi<Profile>(`/v1/profiles/${link}`, true);
}

export async function getProfileAvatar(profile: Profile | undefined, size: 'sm' | 'md' | 'lg' = 'md'): Promise<ProfileAvatar | undefined> {
    return await fetchApi<ProfileAvatar>(`/v1/users/${profile?.id}/avatar?size=${size}`);
}

export async function getMyAvatar(size: 'sm' | 'md' | 'lg' = 'md'): Promise<ProfileAvatar | undefined> {
    return await fetchApi<ProfileAvatar>(`/v1/profiles/me/avatar?size=${size}`, true);
}

