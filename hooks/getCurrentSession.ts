import ory from "@/lib/ory";
import { Session } from "@ory/client-fetch";
import { headers } from "next/headers";

export default async function getCurrentSession() {
    try {
        return await ory.toSession({
            cookie: (await headers()).get("cookie") ?? "",
        }) as Session;
    } catch (error) {
        return undefined;
    }
}

export async function isCurrentSessionActive() {
    const currentSession = await getCurrentSession();
    return currentSession?.active === true;
}
