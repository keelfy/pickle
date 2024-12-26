"use client";

import React from "react";
import { getOrderTableColumns } from "../columns";
import { DataTable } from "../data-table";

type Props = {
    initialOrders: Order[];
    isUserAuthorized: boolean;
    placeholder?: React.ReactNode;
};

export default function OrdersDataTable({
    initialOrders,
    isUserAuthorized,
    placeholder,
}: Props) {
    // Load more with cursor
    const [orders, setOrders] = React.useState<Order[]>(initialOrders);
    const [cursor, setCursor] = React.useState<string>(
        new Date().toISOString()
    );

    return (
        <DataTable
            columns={getOrderTableColumns(isUserAuthorized)}
            data={orders ?? []}
            placeholder={placeholder}
        />
    );
}
