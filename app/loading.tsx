import LoadingSpinner from "@/components/ui/loading-spinner";

export default function Loading() {
    return (
        <div className="flex items-center justify-center w-screen h-screen">
            <LoadingSpinner type="bars" />
        </div>
    );
}
