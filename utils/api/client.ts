import { createClient } from "../supabase/client";
import { apiFetcher } from "./fetcher";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function fetchWithAuth<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    return fetchApi<T>(url, true, options);
}

async function getTokenFromSession(): Promise<string | undefined> {
    const supabase = createClient();
    return await supabase.auth.getSession().then(x => x.data.session?.access_token)
}

export async function fetchApi<T>(
    url: string,
    authorized: boolean = false,
    options: RequestInit = {}
): Promise<T> {
    const token = authorized ? await getTokenFromSession() : undefined;
    return apiFetcher<T>(url, token, options);
}
