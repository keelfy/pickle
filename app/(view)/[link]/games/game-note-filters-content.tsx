"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "@/query-params/filter";
import { PopoverClose } from "@radix-ui/react-popover";
import React from "react";
import { GameNoteStatusIcon } from "./game-note-status-badge";

type Props = {
    value: Filter[];
    onChange: (filters: Filter[]) => void;
}

const statusOptions = [
    { value: "any", label: "Any status" },
    { value: "planned", label: "Planned" },
    { value: "playing", label: "Playing" },
    { value: "paused", label: "Paused" },
    { value: "skipped", label: "Skipped" },
    { value: "finished", label: "Finished" },
    { value: "dropped", label: "Dropped" },
]

export default function GameNoteFiltersContent({ value, onChange }: Props) {
    const [filters, setFilters] = React.useState<Filter[]>(value);

    const handleStatusChange = (value: string) => {
        setFilters(prev => {
            if (value === "any") {
                return prev.filter(filter => filter.name !== "status");
            }

            const prevValue = prev.find(filter => filter.name === "status")?.value;
            if (prevValue) {
                return prev.map(filter => filter.name === "status" ? { ...filter, value } : filter);
            }
            return [...prev, { name: "status", value }];
        });
    }

    const handleRequesterChange = (value: string) => {
        setFilters(prev => {
            if (value.length === 0) {
                return prev.filter(filter => filter.name !== "requester");
            }

            const prevValue = prev.find(filter => filter.name === "requester")?.value;
            if (prevValue) {
                return prev.map(filter => filter.name === "requester" ? { ...filter, value } : filter);
            }
            return [...prev, { name: "requester", value }];
        });
    }

    const handleApplyFilters = () => {
        onChange(filters);
    }

    const handleClearFilters = () => {
        setFilters([]);
        onChange([]);
    }

    const areFiltersChanged = React.useMemo(() => JSON.stringify(filters) !== JSON.stringify(value), [filters, value]);
    const areFiltersCleared = React.useMemo(() => filters.length === 0, [filters]);

    React.useEffect(() => {
        setFilters(value);
    }, [value]);

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                    onValueChange={handleStatusChange}
                    value={filters.find((filter) => filter.name === "status")?.value ?? "any"}
                    defaultValue="any"
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} indicatorPosition="right">
                                <div className="flex items-center gap-1">
                                    <GameNoteStatusIcon status={option.value as GameNoteStatus} classname="w-4 h-4" />
                                    {option.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label className="text-sm font-medium">Requested By</Label>
                <Input
                    placeholder="Username"
                    value={filters.find((filter) => filter.name === "requester")?.value ?? ""}
                    onChange={(e) => handleRequesterChange(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <PopoverClose asChild>
                    <Button
                        variant="destructive"
                        size='sm'
                        onClick={handleClearFilters}
                        disabled={areFiltersCleared}
                    >
                        Clear
                    </Button>
                </PopoverClose>
                <PopoverClose asChild>
                    <Button
                        size='sm'
                        onClick={handleApplyFilters}
                        disabled={!areFiltersChanged}
                    >
                        Apply
                    </Button>
                </PopoverClose>
            </div>
        </div>
    );
}
