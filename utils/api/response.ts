import { Content, ExternalSearchResult, Order } from "./types";

export type SearchHit<T> = {
    id: string;
    source: T;
    score: number;
}

export type Paginated<T> = {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export type PaginatedOrders = Paginated<Order>;

export type LinkValidation = {
    valid: boolean;
    message: string;
}

export type ContentSearchHits = Paginated<SearchHit<Content>>;

export type ExternalSearchHits = Paginated<SearchHit<ExternalSearchResult>>;
