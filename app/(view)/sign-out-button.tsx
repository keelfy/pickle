"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOutAction } from "../actions";
import React from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { LogOut } from "lucide-react";

const DropdownMenuSignOutItem = () => {
    const [isPending, startTransition] = React.useTransition();

    const onSignOut = () => startTransition(async () => {
        await signOutAction();
        window.location.reload();
    });

    return (
        <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
            {isPending ? <LoadingSpinner /> : <LogOut />}
            Log Out
        </DropdownMenuItem>
    );
};

export default DropdownMenuSignOutItem;
