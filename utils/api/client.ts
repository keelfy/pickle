import { createClient } from "../supabase/client";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function fetchWithAuth<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    try {
        const token = await getTokenFromSession();

        const headers = new Headers(options.headers);

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        const response = await fetch(baseURL + url, { ...options, headers });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json() as T;
    } catch (error) {
        console.log("Error fetching data: ", error);
        throw error;
    }
}

async function getTokenFromSession(): Promise<string | undefined> {
    const supabase = createClient();
    return await supabase.auth.getSession().then(x => x.data.session?.access_token)
}
