"use client";

import ApiTypeCommand from "@/components/ui/api-type-command";
import { ApiType, contentCategoryLabels } from "@/utils/api/constants";

type Props = {
    value: ContentCategory;
    onSelect: (value: ContentCategory) => void;
    getLabel: (category: ApiType<ContentCategory>) => any;
};

const OrderCategoryCommand = (props: Props) => {
    return (
        <ApiTypeCommand
            entries={contentCategoryLabels}
            placeholder="Search category..."
            nothingFound="No category found."
            {...props}
        />
    );
};

export default OrderCategoryCommand;
