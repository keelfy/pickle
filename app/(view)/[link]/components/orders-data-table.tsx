"use client";

import { fetchProfileOrders } from "@/hooks/api-endpoints-client";
import { useProfileStore } from "@/providers/profile-store";
import { Order } from "@/utils/api/types";
import React from "react";
import { getOrderTableColumns } from "../columns";
import { DataTable } from "../data-table";

type Props = {
    placeholder?: React.ReactNode;
};

export default function OrdersDataTable({ placeholder }: Props) {
    const profile = useProfileStore((state) => state.profile);

    const [orders, setOrders] = React.useState<Order[]>([]);
    const [cursor, setCursor] = React.useState<string>(
        new Date("1900-01-24").toISOString()
    );

    React.useEffect(() => {
        if (!profile) return
        (async () => {
            try {
                const orders = await fetchProfileOrders(profile, cursor, 'created_at', 10, 'desc');
                setOrders(orders ?? []);
            } catch (error: any) {
                console.log(error);
            }
        })();
    }, [profile?.id]);

    return (
        <DataTable
            columns={getOrderTableColumns(profile?.isAuthorized ?? false)}
            data={orders}
            placeholder={placeholder}
        />
    );
}
