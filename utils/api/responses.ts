type Paginated<T> = {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

type PaginatedOrders = Paginated<Order>;

type LinkValidation = {
    valid: boolean;
    message: string;
}
