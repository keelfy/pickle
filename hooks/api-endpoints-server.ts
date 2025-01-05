import { fetchApi } from "@/utils/api/server";
import { User } from "@supabase/supabase-js";

export async function getProfileByUser(user: User | null): Promise<Profile | undefined> {
    return await fetchApi<Profile>(`/v1/users/${user?.id}`);
}

export async function getMyProfile(): Promise<Profile | undefined> {
    return await fetchApi<Profile>(`/v1/profiles/me`, true);
}

export async function getProfileByLink(link: string): Promise<Profile | undefined> {
    return await fetchApi<Profile>(`/v1/profiles/${link}`, true);
}

