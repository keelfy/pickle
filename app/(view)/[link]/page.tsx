"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
    Filter,
    Instagram,
    Search,
    SortAsc,
    Twitch,
    Twitter,
    Youtube,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import ApproveModal from "./approve-modal";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import InteractiveGameEditorModal from "./interactive-game-editor-modal";

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

    useEffect(() => {
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
            <ApproveModal />
            <InteractiveGameEditorModal />
            <div className="flex gap-10">
                <div className="flex flex-col gap-6">
                    <Card className="w-[300px]">
                        <div className="flex items-center p-6 gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>
                                    {link.substring(0, 1)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col space-y-1.5">
                                <CardTitle>{link}</CardTitle>
                                <CardDescription>Mega Streamer</CardDescription>
                            </div>
                        </div>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit. Vestibulum nec dui tortor.
                                Vivamus nec tincidunt ante. Vestibulum ante
                                ipsum primis in faucibus orci luctus et ultrices
                                posuere cubilia curae; Vestibulum pulvinar enim
                                sit amet egestas pulvinar. Praesent tristique
                                sollicitudin arcu, non accumsan elit posuere et.
                                Aliquam euismod, sem ut sodales interdum, nunc
                                diam efficitur sem, eget auctor arcu metus vel
                                sapien. Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit. Sed turpis nulla, viverra eu
                                eleifend nec, auctor pretium justo.
                            </p>
                        </CardContent>
                    </Card>
                    <div className="flex flex-col gap-3 p-2">
                        <h2 className="text-lg font-semibold">
                            Follow {link}:
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon">
                                <Twitch />
                            </Button>
                            <Button variant="outline" size="icon">
                                <Youtube />
                            </Button>
                            <Button variant="outline" size="icon">
                                <Twitter />
                            </Button>
                            <Button variant="outline" size="icon">
                                <Instagram />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-1 flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h1>Latest Orders</h1>
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
                    <div className="rounded-md border">
                        <DataTable
                            columns={columns}
                            data={orders?.content ?? []}
                        />
                    </div>
                    <Pagination>
                        <PaginationContent>
                            {page > 0 && (
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={`?page=${Math.max(page - 1, 0)}`}
                                    />
                                </PaginationItem>
                            )}
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
                            {(orders?.totalPages ?? 0) > page + 1 && (
                                <PaginationItem>
                                    <PaginationNext
                                        disabled
                                        href={`?page=${Math.min(page + 1, orders?.totalPages ?? 0)}`}
                                    />
                                </PaginationItem>
                            )}
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </>
    );
};

export default Page;
