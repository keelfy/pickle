import { Edit } from "lucide-react";

type Props = {
    value: Date | undefined;
    disabled?: boolean;
};

const EditableDate = ({ value, disabled = false }: Props) => {
    return (
        <div className="flex w-full items-center justify-between space-x-1">
            <div className="text-sm">
                {value ? new Date(value).toLocaleDateString() : <>&mdash;</>}
            </div>
            {!disabled && <Edit />}
        </div>
    );
};

export default EditableDate;

