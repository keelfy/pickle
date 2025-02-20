"use server";

import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { Provider } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (email: string, password: string, goto: string = "/") => {
    const supabase = await createClient();
    const origin = (await headers()).get("origin");

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        console.error(error.code + " " + error.message);
        return encodedRedirect("error", "/sign-up", goto, error.message);
    } else {
        return encodedRedirect(
            "success",
            "/sign-in",
            goto,
            // "Thanks for signing up! Please check your email for a verification link."
            "Thanks for signing up! You can now log in."
        );
    }
};

export const signInAction = async (email: string, password: string, goto: string = "/") => {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return encodedRedirect("error", "/sign-in", goto, error.message);
    }

    return redirect(goto && goto.length > 0 ? decodeURIComponent(goto) : "/");
};

export const signInWithProviderAction = async (provider: Provider, goto: string = "/") => {
    const origin = (await headers()).get("origin");
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: origin + `/auth/callback${goto && goto.length > 0 ? `?redirect_to=${goto}` : ""}`,
        }
    });

    if (error) {
        return encodedRedirect("error", "/sign-in", goto, error.message);
    }

    return redirect(data.url);
};

export const forgotPasswordAction = async (formData: FormData) => {
    const email = formData.get("email")?.toString();
    const supabase = await createClient();
    const origin = (await headers()).get("origin");
    const callbackUrl = formData.get("callbackUrl")?.toString();

    if (!email) {
        return encodedRedirect("error", "/forgot-password", "/", "Email is required");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
    });

    if (error) {
        console.error(error.message);
        return encodedRedirect("error", "/forgot-password", "/", "Could not reset password");
    }

    if (callbackUrl) {
        return redirect(callbackUrl);
    }

    return encodedRedirect(
        "success",
        "/forgot-password",
        "/",
        "Check your email for a link to reset your password."
    );
};

export const changePasswordAction = async ({ currentPassword, newPassword }: { currentPassword: string, newPassword: string }) => {
    const supabase = await createClient();

    if (!currentPassword) {
        return "Current password is required";
    } else if (!newPassword) {
        return "Password is required";
    } else if (newPassword.length < 6) {
        return "Password must be at least 6 characters";
    };

    // Get the current user's email
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) {
        return 'User not authenticated'
    }

    // Verify current password
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
    });

    if (signInError) {
        return 'Invalid current password'
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) {
        return "Password update failed";
    }

    return undefined;
};

export const changeEmailAction = async (email: string) => {
    if (!email) {
        return "Email is required";
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return "User not authenticated";
    } else if (session?.user.email === email) {
        return "Email is the same as current email";
    }

    const { error } = await supabase.auth.updateUser({
        email,
    });

    if (error) {
        return error.message ? error.message : "Failed to update email";
    }

    return undefined;
}

export const signOutAction = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
};

export const logOutAllDevicesAction = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "global" });
}
