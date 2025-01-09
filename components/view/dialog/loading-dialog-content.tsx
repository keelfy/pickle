import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function LoadingDialogContent() {
    return (
        <>
            <DialogHeader>
                <DialogTitle>Loading...</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center items-center h-32">
                <LoadingSpinner />
            </div>
        </>
    );
}
