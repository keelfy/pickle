"use client";

import { useAuthStore } from "@/providers/auth-store";
import { fetchApi } from "@/utils/api/client";
import React from "react";
import { getOrderTableColumns } from "../columns";
import { DataTable } from "../data-table";

type Props = {
    link: string;
    placeholder?: React.ReactNode;
};

export default function OrdersDataTable({ link, placeholder }: Props) {
    const { user, profile } = useAuthStore((state) => state);
    const isUserAuthorized: boolean =
        user?.id !== null && user?.id !== undefined && user?.id === profile?.id;

    const [orders, setOrders] = React.useState<Order[]>([]);
    const [cursor, setCursor] = React.useState<string>(
        new Date("1900-01-24").toISOString()
    );

    React.useEffect(() => {
        if (!link || link.length === 0) return

        const fetchOrders = async () => {
            try {
                const orders = await fetchApi<Order[]>(
                    `/v1/profiles/${link}/orders?cursor=${cursor}&column=created_at&limit=${10}&direction=desc`
                );
                setOrders(orders);
            } catch (error: any) {
                console.log(error);
            }
        };
        fetchOrders();
        const intervalId = setInterval(fetchOrders, 5000);
        return () => clearInterval(intervalId);
    }, [link]);

    return (
        <DataTable
            columns={getOrderTableColumns(isUserAuthorized)}
            data={orders}
            placeholder={placeholder}
        />
    );
}
