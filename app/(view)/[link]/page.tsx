"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { fetchWithAuth } from "@/utils/api/client";
import { Filter, Search, SortAsc } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React from "react";
import ApproveModal from "./approve-modal";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import InteractiveGameEditorModal from "./interactive-game-editor-modal";
import DenyModal from "./deny-modal";

type Props = {
    params: Promise<{
        link: string;
    }>;
};

const Page = ({ params }: Props) => {
    const link = React.use(params).link;
    const searchParams = useSearchParams();
    const page = parseInt(searchParams.get("page") ?? "0");
    const [orders, setOrders] = React.useState<PaginatedOrders>();

    React.useEffect(() => {
        (async () => {
            try {
                const orders = await fetchWithAuth<PaginatedOrders>(
                    `/v1/users/by-link/${link}/orders?page=${page}&size=5`
                );
                setOrders(orders);
            } catch (error) {
                setOrders(undefined);
            }
        })();
    }, [page]);

    return (
        <>
            <DenyModal />
            <ApproveModal />
            <InteractiveGameEditorModal />
            <div className="flex gap-10">
                <div className="flex flex-1 flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <Label className="text-xl">Suggested recently</Label>
                        <div className="flex items-center gap-2">
                            <div className="relative min-w-96">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="What are you looking for?"
                                    className="pl-8"
                                />
                            </div>
                            <Button variant="ghost" className="flex gap-2">
                                <SortAsc />
                                <span>Sort</span>
                            </Button>
                            <Button variant="ghost" className="flex gap-2">
                                <Filter />
                                <span>Filter</span>
                            </Button>
                        </div>
                    </div>
                    <div>
                        <DataTable
                            columns={columns}
                            data={orders?.content ?? []}
                        />
                    </div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href={`?page=${Math.max(page - 1, 0)}`}
                                />
                            </PaginationItem>
                            {page > 1 && (
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            )}
                            {page > 0 && (
                                <PaginationItem>
                                    <PaginationLink href={`?page=${page - 1}`}>
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            )}
                            <PaginationItem>
                                <PaginationLink isActive href="#">
                                    {page + 1}
                                </PaginationLink>
                            </PaginationItem>
                            {(orders?.totalPages ?? 0) > page + 1 && (
                                <PaginationItem>
                                    <PaginationLink href={`?page=${page + 1}`}>
                                        {page + 2}
                                    </PaginationLink>
                                </PaginationItem>
                            )}
                            {(orders?.totalPages ?? 0) > page + 3 && (
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            )}
                            <PaginationItem>
                                <PaginationNext
                                    href={`?page=${Math.min(page + 2, orders?.totalPages ?? 1) - 1}`}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </>
    );
};

export default Page;
