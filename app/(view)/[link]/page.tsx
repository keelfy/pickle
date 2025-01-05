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
import { Separator } from "@/components/ui/separator";
import { fetchApi } from "@/utils/api/server";
import { createClient } from "@/utils/supabase/server";
import {
    SiInstagram,
    SiTwitch,
    SiX,
    SiYoutube,
} from "@icons-pack/react-simple-icons";
import { Filter, Search, SortAsc } from "lucide-react";
import { Suspense } from "react";
import ApproveModal from "./approve-modal";
import CreateOrderButton from "./components/create-order-button";
import OrdersDataTable from "./components/orders-data-table";
import CreateOrderModal from "./create-order-modal";
import DenyModal from "./deny-modal";
import InteractiveGameEditorModal from "./interactive-game-editor-modal";
import ProfileSettingsModal from "./profile-settings-modal";
import SearchModal from "./search-modal";
import { getProfileByLink } from "@/hooks/api-endpoints-server";

type Props = {
    params: Promise<{
        link: string;
    }>;
};

async function OrdersDataTableWrapper({
    link,
    isUserAuthorized,
}: {
    link: string;
    isUserAuthorized: boolean;
}) {
    let orders: Order[] = [];
    try {
        orders = await fetchApi<Order[]>(
            `/v1/profiles/${link}/orders?cursor=${new Date().toISOString()}&limit=${10}`
        );
    } catch (error: any) {
        console.log(error);
    }

    return (
        <OrdersDataTable
            isUserAuthorized={isUserAuthorized}
            initialOrders={orders}
        />
    );
}

export default async function Page({ params }: Props) {
    const supabase = await createClient();
    const link = (await params).link;
    // const searchParams = useSearchParams();
    // const page = parseInt(searchParams.get("page") ?? "0");

    let ownerProfile: Profile | undefined = undefined;

    try {
        ownerProfile = await getProfileByLink(link);
    } catch (error: any) {
        return (
            <>
                <ProfileSettingsModal />
                <div className="flex flex-col space-y-2 items-center justify-center h-full text-center">
                    <p className="font-semibold text-lg">Profile not found.</p>
                    <p className="text-red-300">{error.message}</p>
                </div>
            </>
        );
    }

    const {
        data: { user: authorizedUser },
    } = await supabase.auth.getUser();

    const isUserAuthorized =
        ownerProfile !== null && authorizedUser?.id == ownerProfile?.id;

    return (
        <>
            <DenyModal />
            <ApproveModal />
            <InteractiveGameEditorModal />
            <SearchModal />
            <CreateOrderModal link={link} />
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
                                <CardTitle>{ownerProfile?.username}</CardTitle>
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
                                <SiTwitch />
                            </Button>
                            <Button variant="outline" size="icon">
                                <SiYoutube />
                            </Button>
                            <Button variant="outline" size="icon">
                                <SiX />
                            </Button>
                            <Button variant="outline" size="icon">
                                <SiInstagram />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-1 flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Label className="text-xl">
                                Suggested recently
                            </Label>
                            {isUserAuthorized && <CreateOrderButton />}
                        </div>
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
                    <Suspense
                        fallback={
                            <OrdersDataTable
                                initialOrders={[]}
                                isUserAuthorized={false}
                                placeholder="Loading..."
                            />
                        }
                    >
                        <OrdersDataTableWrapper
                            link={link}
                            isUserAuthorized={isUserAuthorized}
                        />
                    </Suspense>
                    {/* <Pagination>
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
                    </Pagination> */}
                </div>
            </div>
        </>
    );
}
