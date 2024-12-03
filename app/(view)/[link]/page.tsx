"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import React from "react";
import ApproveModal from "./approve-modal";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import DenyModal from "./deny-modal";
import InteractiveGameEditorModal from "./interactive-game-editor-modal";
import { Separator } from "@/components/ui/separator";
import SearchModal from "./search-modal";

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
            <SearchModal />
            <div className="flex gap-10">
                <Card className="w-80 h-fit">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>
                                    {link.substring(0, 1)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-0.5">
                                <CardTitle>{link}</CardTitle>
                                <CardDescription>Mega Streamer</CardDescription>
                            </div>
                            {/* <p className="text-md font-bold truncate">brDrLRVJLgdwTqXvPeezzkKqV</p> // 25 characters */}
                            {/* <p className="text-xl font-bold truncate w-48">LuxGp2F4CkyAJ17XRg2hprF6tTuEVhcHKWVtCx2U6cwcU158YxgCTEtyJcJT</p> // 64 characters */}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit, sed do eiusmod tempor incididunt ut labore et
                            dolore magna aliqua. Ut enim ad minim veniam, quis
                            nostrud exercitation ullamco laboris nisi ut aliquip
                            ex ea commodo consequat. Duis aute irure dolor in
                            reprehenderit in voluptate velit esse cillum dolore
                            eu fugiat nulla pariatur. Excepteur sint occaecat
                            cupidatat non proident, sunt in culpa qui officia
                            deserunt mollit anim id est laborum.
                        </div>
                        <Separator className="my-4" />
                        <div className="flex items-center justify-around gap-2">
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
                    </CardContent>
                </Card>

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
                            <Button variant="ghost" size="icon">
                                <SortAsc />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Filter />
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
