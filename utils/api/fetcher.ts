const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function apiFetcher<T>(
    url: string,
    token: string | undefined,
    options: RequestInit = {},
    cookies?: string
): Promise<T> {
    try {
        const headers = new Headers(options.headers);

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        if (cookies) {
            headers.set("Cookie", cookies);
        }

        const response = await fetch(baseURL + url, {
            ...options,
            headers,
            credentials: "include"
        });
        const contentType = response.headers.get("Content-Type");

        let body: any = undefined;

        if (contentType?.includes("application/json")) {
            body = await response.json();
        } else {
            body = await response.text();
        }

        if (response.status >= 400) {
            if (body?.error) {
                throw new Error(body.error);
            } else if (body && typeof body === "string" && body.length > 0) {
                throw new Error(body);
            }
            throw new Error(`Status code: ${response.status}`);
        }

        return body as T;
    } catch (error) {
        console.error("Error fetching data: ", error);
        throw error;
    }
}
