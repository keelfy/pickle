import { Edit } from "lucide-react";

type Props = {
    value: Date | undefined;
};

const EditableDate = ({ value }: Props) => {
    return (
        <div className="flex w-full items-center justify-between space-x-1 p-1">
            <div className="text-sm">
                {value ? new Date(value).toLocaleDateString() : <>&mdash;</>}
            </div>
            <Edit />
        </div>
    );
};

export default EditableDate;

