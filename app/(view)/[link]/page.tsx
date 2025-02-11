import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { Filter, SortAsc, UserPlusIcon } from "lucide-react";
import { Suspense } from "react";
import CollectionsSection from "../../../components/view/content-collections/collections-section";
import CreateOrderButton from "./components/create-order-button";
import OrdersDataTable from "./components/orders-data-table";

type Props = {
    params: Promise<{ link: string }>;
}

export default function Page({ params }: Props) {
    return (
        <div className="flex flex-col gap-4">
            <Suspense fallback={<LoadingSpinner />}>
                <CollectionsSection params={params} />
            </Suspense>
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UserPlusIcon className="w-4 h-4" />
                        <Label className="text-lg">Latest suggestions</Label>
                    </div>
                    <Separator className="flex-1 mx-2" />
                    <div className="flex items-center gap-2">
                        {/* <div className="relative min-w-96">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="What are you looking for?"
                                className="pl-8"
                            />
                        </div> */}
                        <CreateOrderButton />
                        <Button variant="ghost" size="icon">
                            <SortAsc />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Filter />
                        </Button>
                    </div>
                </div>
                <Suspense fallback={<LoadingSpinner />}>
                    <OrdersDataTable />
                </Suspense>
            </div>
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
    );
}
