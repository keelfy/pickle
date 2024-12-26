import { SheetMenu } from "@/components/dashboard/sheet-menu";
import UserNav from "@/components/dashboard/user-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { fetchApi } from "@/utils/api/server";
import { createClient } from "@/utils/supabase/server";

interface NavbarProps {
    title: string;
}

const Navbar = async ({ title }: NavbarProps) => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const userDetails = await fetchApi<Profile>(`/v1/users/${user?.id}`);

    return (
        <header className="sticky top-0 z-10 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
            <div className="mx-4 sm:mx-8 flex h-14 items-center">
                <div className="flex items-center space-x-4 lg:space-x-0">
                    <SheetMenu />
                    <h1 className="font-bold">{title}</h1>
                </div>
                <div className="flex flex-1 items-center justify-end">
                    <ModeToggle />
                    <UserNav userDetails={userDetails} />
                </div>
            </div>
        </header>
    );
};

export default Navbar;
