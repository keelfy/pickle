import { createClient } from "../supabase/client";
import { apiFetcher } from "./fetcher";

async function getTokenFromSession(): Promise<string | undefined> {
    const supabase = createClient();
    return await supabase.auth.getSession().then(x => x.data.session?.access_token)
}

export async function fetchApi<T>(
    url: string,
    authorized: boolean = true,
    options: RequestInit = {}
): Promise<T> {
    const token = authorized ? await getTokenFromSession() : undefined;
    return apiFetcher<T>(url, token, options);
}

export async function setCookieFromSession(): Promise<void> {
    try {
        const token = await getTokenFromSession();
        await apiFetcher<void>("/v1/auth/set-cookie", undefined, {
            method: "POST",
            body: JSON.stringify({ token })
        });
    } catch (error) {
        console.error("Failed to set authentication cookie:", error);
        throw error;
    }
}

export async function clearAuthCookie(): Promise<void> {
    try {
        await apiFetcher<void>("/v1/auth/clear-cookie", undefined, {
            method: "POST",
        });
    } catch (error) {
        console.error("Failed to clear authentication cookie:", error);
        throw error;
    }
}
