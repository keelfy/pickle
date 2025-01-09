type SearchHit<T> = {
    source: T;
    score: number;
}

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

type ContentSearchHits = Paginated<SearchHit<Content>>;
