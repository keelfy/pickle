import { createClient } from "@/utils/supabase/server";
import { SupabaseClient, User } from "@supabase/supabase-js";

export default async function getUser(supabase?: SupabaseClient): Promise<User | undefined> {
    if (!supabase) {
        supabase = await createClient();
    }
    
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return user ?? undefined;
}


