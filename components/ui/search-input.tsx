import { Search } from "lucide-react";
import { Input, InputProps } from "./input";

type Props = {
    inputProps: InputProps;
};

const SearchInput = ({ inputProps, ...props }: Props) => {
    return (
        <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input {...inputProps} className="pl-8" />
        </div>
    );
};

export default SearchInput;
