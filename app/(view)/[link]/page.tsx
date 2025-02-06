import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, Search, SortAsc } from "lucide-react";
import CreateOrderButton from "./components/create-order-button";
import OrdersDataTable from "./components/orders-data-table";

export default function Page() {
    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Label className="text-xl">Suggested recently</Label>
                    <CreateOrderButton />
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
            <OrdersDataTable />
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
