"use client";

import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import React from "react";

export type Filter = {
    name: string;
    value: any;
}

const deserializeFilter = (filter: string): Filter => {
    const [name, value] = filter.split(":");
    return { name, value };
}

const serializeFilter = (filter: Filter): string => {
    return `${filter.name}:${filter.value}`;
}

export default function useFilterQueryState(defaultValue: Filter[] = []) {
    const [isInitialized, setIsInitialized] = React.useState(false);
    const [filters, setLocalFilters] = React.useState<Filter[]>(defaultValue);

    const [filterQuery, setFilterQuery] = useQueryState(
        "filters",
        parseAsArrayOf(parseAsString).withDefault(defaultValue.map(serializeFilter))
    );

    const setFilters = React.useCallback((value: Filter[]) => {
        setLocalFilters(value);
        setFilterQuery(value.map(serializeFilter));
    }, [setFilterQuery]);

    React.useEffect(() => {
        const serializedFilters = filters.map(serializeFilter);
        if (JSON.stringify(serializedFilters) !== JSON.stringify(filterQuery)) {
            setIsInitialized(true);
            setLocalFilters(filterQuery.map(deserializeFilter) ?? defaultValue);
        } else if (!isInitialized) {
            setIsInitialized(true);
        }
    }, [filterQuery, defaultValue]);

    return { filters, setFilters, isInitialized };
};
