import { Content, Order } from "./types";

export type SearchHit<T> = {
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
