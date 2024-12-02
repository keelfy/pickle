import { Button, ButtonProps } from "@/components/ui/button";
import { Edit } from "lucide-react";

type Props = ButtonProps & {
    value: string;
};

const EditableStatusButton = ({ value, ...props }: Props) => {
    return (
        <Button variant="ghost" size="icon" className="w-full h-8" {...props}>
            <div className="flex w-full items-center justify-between space-x-1 p-1">
                <div className="text-sm">{value}</div>
                <Edit />
            </div>
        </Button>
    );
};

export default EditableStatusButton;
