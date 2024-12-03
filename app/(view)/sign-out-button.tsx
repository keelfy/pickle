"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOutAction } from "../actions";

const DropdownMenuSignOutItem = () => {
    return (
        <DropdownMenuItem onClick={signOutAction}>
            {false ? "Loading..." : "Log out"}
        </DropdownMenuItem>
    );
};

export default DropdownMenuSignOutItem;
