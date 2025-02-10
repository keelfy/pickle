"use client";

import { fetchProfileOrders } from "@/hooks/api-endpoints-client";
import { useAuthStore } from "@/providers/auth-store";
import { useProfileStore } from "@/providers/profile-store";
import { Order } from "@/utils/api/types";
import React from "react";
import { getOrderTableColumns } from "../columns";
import { DataTable } from "../data-table";

type Props = {
    placeholder?: React.ReactNode;
};

export default function OrdersDataTable({ placeholder }: Props) {
    const { user } = useAuthStore((state) => state);
    const profile = useProfileStore((state) => state.profile);
    const isUserAuthorized: boolean =
        user?.id !== null && user?.id !== undefined && user?.id === profile?.id;

    const [orders, setOrders] = React.useState<Order[]>([]);
    const [cursor, setCursor] = React.useState<string>(
        new Date("1900-01-24").toISOString()
    );

    React.useEffect(() => {
        if (!profile) return

        const fetchOrders = async () => {
            try {
                const orders = await fetchProfileOrders(profile, cursor, 'created_at', 10, 'desc');
                setOrders(orders ?? []);
            } catch (error: any) {
                console.log(error);
            }
        };
        fetchOrders();
        const intervalId = setInterval(fetchOrders, 5000);
        return () => clearInterval(intervalId);
    }, [profile?.id]);

    return (
        <DataTable
            columns={getOrderTableColumns(isUserAuthorized)}
            data={orders}
            placeholder={placeholder}
        />
    );
}
