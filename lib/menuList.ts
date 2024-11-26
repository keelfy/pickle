import {
    Clapperboard,
    Gamepad,
    LayoutGrid,
    LucideIcon,
    Settings,
    Tv,
    Users,
} from "lucide-react";

type Submenu = {
    href: string;
    label: string;
    active: boolean;
};

type Menu = {
    href: string;
    label: string;
    active: boolean;
    icon: LucideIcon;
    submenus: Submenu[];
};

type Group = {
    groupLabel: string;
    menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
    return [
        {
            groupLabel: "",
            menus: [
                {
                    href: "/dashboard",
                    label: "Dashboard",
                    active: pathname.includes("/dashboard"),
                    icon: LayoutGrid,
                    submenus: [],
                },
            ],
        },
        {
            groupLabel: "Contents",
            menus: [
                {
                    href: "/games",
                    label: "Games",
                    active: pathname.includes("/games"),
                    icon: Gamepad,
                    submenus: [],
                },
                {
                    href: "",
                    label: "Movies",
                    active: pathname.includes("/posts"),
                    icon: Clapperboard,
                    submenus: [
                        {
                            href: "/posts",
                            label: "All Posts",
                            active: pathname === "/posts",
                        },
                        {
                            href: "/posts/new",
                            label: "New Post",
                            active: pathname === "/posts/new",
                        },
                    ],
                },
                {
                    href: "/tags",
                    label: "Serials and Anime",
                    active: pathname.includes("/tags"),
                    icon: Tv,
                    submenus: [],
                },
            ],
        },
        {
            groupLabel: "Settings",
            menus: [
                {
                    href: "/users",
                    label: "Users",
                    active: pathname.includes("/users"),
                    icon: Users,
                    submenus: [],
                },
                {
                    href: "/account",
                    label: "Account",
                    active: pathname.includes("/account"),
                    icon: Settings,
                    submenus: [],
                },
            ],
        },
    ];
}
