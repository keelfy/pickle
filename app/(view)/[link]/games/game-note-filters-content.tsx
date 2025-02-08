"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PopoverClose } from "@radix-ui/react-popover";
import React from "react";

const FILTER_OPTIONS = [
    {
        label: "Status",
        value: "status",
    },
    {
        label: "Requested By",
        value: "requester",
    },
];

type Filter = {
    name: string;
    value: string;
}

type Props = {
    onChange: (filters: string) => void;
}

export default function GameNoteFiltersContent({ onChange }: Props) {
    const [filters, setFilters] = React.useState<Filter[]>([]);

    const handleStatusChange = (value: string) => {
        setFilters(prev => {
            const prevValue = prev.find(filter => filter.name === "status")?.value;
            if (prevValue) {
                return prev.map(filter => filter.name === "status" ? { ...filter, value } : filter);
            }
            return [...prev, { name: "status", value }];
        });
    }

    const handleRequesterChange = (value: string) => {
        setFilters(prev => {
            const prevValue = prev.find(filter => filter.name === "requester")?.value;
            if (prevValue) {
                return prev.map(filter => filter.name === "requester" ? { ...filter, value } : filter);
            }
            return [...prev, { name: "requester", value }];
        });
    }

    const handleApplyFilters = () => {
        onChange(filters
            .filter((filter) => filter.value !== "any")
            .map((filter) => `${filter.name}:${filter.value}`)
            .join(","));
    }

    const handleClearFilters = () => {
        setFilters([]);
        onChange("");
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                    onValueChange={handleStatusChange}
                    value={filters.find((filter) => filter.name === "status")?.value}
                    defaultValue="any"
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="any">Any status</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="playing">Playing</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="skipped">Skipped</SelectItem>
                        <SelectItem value="finished">Finished</SelectItem>
                        <SelectItem value="dropped">Dropped</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label className="text-sm font-medium">Requested By</Label>
                <Input
                    placeholder="Username"
                    value={filters.find((filter) => filter.name === "requester")?.value}
                    onChange={(e) => handleRequesterChange(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <PopoverClose asChild>
                    <Button variant="destructive" size='sm' onClick={handleClearFilters}>Clear</Button>
                </PopoverClose>
                <PopoverClose asChild>
                    <Button size='sm' onClick={handleApplyFilters}>Apply</Button>
                </PopoverClose>
            </div>
        </div>
    );
}
