const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function apiFetcher<T>(
    url: string,
    token: string | undefined,
    options: RequestInit = {}
): Promise<T> {
    try {
        const headers = new Headers(options.headers);

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        const response = await fetch(baseURL + url, { ...options, headers });
        const contentType = response.headers.get("Content-Type");

        let body: any = undefined;

        if (contentType?.includes("application/json")) {
            body = await response.json();
        } else {
            body = await response.text();
        }

        if (!response.ok) {
            if (body?.error) {
                throw new Error(body.error);
            } else if (body && typeof body === "string" && body.length > 0) {
                throw new Error(body);
            }
            throw new Error(`Status code: ${response.status}`);
        }

        return body as T;
    } catch (error) {
        console.log("Error fetching data: ", error);
        throw error;
    }
}
