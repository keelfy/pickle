import { createClient } from "../supabase/server";
import { apiFetcher } from "./fetcher";

export async function fetchWithAuth<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    return fetchApi<T>(url, true, options);
}

export async function fetchApi<T>(
    url: string,
    authorized: boolean = false,
    options: RequestInit = {}
): Promise<T> {
    const token = authorized ? await getTokenFromSession() : undefined;
    return apiFetcher<T>(url, token, options);
}

async function getTokenFromSession(): Promise<string | undefined> {
    const supabase = await createClient();
    return await supabase.auth
        .getSession()
        .then((x) => x.data.session?.access_token);
}
