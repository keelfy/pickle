"use client";

import ApiTypeCommand from "@/components/ui/api-type-command";
import { ApiType, orderCategories } from "@/utils/api/constants";

type Props = {
    value: number;
    onSelect: (value: number) => void;
    getLabel: (category: ApiType) => any;
};

const OrderCategoryCommand = (props: Props) => {
    return (
        <ApiTypeCommand
            entries={orderCategories}
            placeholder="Search category..."
            nothingFound="No category found."
            {...props}
        />
    );
};

export default OrderCategoryCommand;
