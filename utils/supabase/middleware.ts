import getCurrentSession from "@/hooks/getCurrentSession";
import ory, { fetchOry } from "@/lib/ory";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const session = await getCurrentSession();
    if (session && !session.active) {
        const res = await fetchOry(`/admin/sessions/${session.id}/extend`, {
            method: 'PATCH',
        })

        if (res.status === 204) {
            response = NextResponse.next({
                request: {
                    headers: request.headers,
                },
            });
        } else {
            return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/login/browser?return_to=${request.nextUrl.pathname}`, request.nextUrl.origin));
        }
    }

    // const supabase = createServerClient(
    //     process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    //     {
    //         cookies: {
    //             getAll() {
    //                 return request.cookies.getAll();
    //             },
    //             setAll(cookiesToSet) {
    //                 cookiesToSet.forEach(({ name, value }) =>
    //                     request.cookies.set(name, value)
    //                 );
    //                 response = NextResponse.next({
    //                     request,
    //                 });
    //                 cookiesToSet.forEach(({ name, value, options }) =>
    //                     response.cookies.set(name, value, options)
    //                 );
    //             },
    //         },
    //     }
    // );

    // // This will refresh session if expired - required for Server Components
    // // https://supabase.com/docs/guides/auth/server-side/nextjs
    // const user = await supabase.auth.getUser();

    // const { pathname, origin } = request.nextUrl;

    // protected routes
    // if (["/dashboard"].includes(pathname) && user.error) {
    //     return NextResponse.redirect(new URL(`/sign-in?goto=${encodeURIComponent(pathname)}`, origin));
    // }

    return response;
};
