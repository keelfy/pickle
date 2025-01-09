"use client";

import ApiTypeCommand from "@/components/ui/api-type-command";
import { ApiType, contentCategories } from "@/utils/api/constants";

type Props = {
    value: number;
    onSelect: (value: number) => void;
    getLabel: (category: ApiType) => any;
};

const OrderCategoryCommand = (props: Props) => {
    return (
        <ApiTypeCommand
            entries={contentCategories}
            placeholder="Search category..."
            nothingFound="No category found."
            {...props}
        />
    );
};

export default OrderCategoryCommand;
