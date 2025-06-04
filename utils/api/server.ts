import { createClient } from "../supabase/server";
import { apiFetcher } from "./fetcher";

async function getTokenFromSession(): Promise<string | undefined> {
    const supabase = await createClient();
    return await supabase.auth.getSession()
        .then(x => x.data.session?.access_token)
}

export async function fetchApi<T>(
    url: string,
    authorized: boolean = true,
    options: RequestInit = {}
): Promise<T> {
    const token = authorized ? await getTokenFromSession() : undefined;
    return apiFetcher<T>(url, token, options);
}
