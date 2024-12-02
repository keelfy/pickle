import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOrderModal } from "./order-modal-context";

const DenyModal = () => {
    const { currentModal, order, closeModal } = useOrderModal();

    if (currentModal !== "deny" || !order) {
        return null;
    }

    return (
        <AlertDialog open={currentModal === "deny"} onOpenChange={closeModal}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <p>
                            You're about to cancel suggestion of&nbsp;
                            <span className="font-semibold">
                                {order.message}
                            </span>
                            &nbsp;from&nbsp;
                            <span className="font-semibold">
                                {order.ordererUsername}
                            </span>
                            .
                        </p>
                        <br />
                        <p>
                            By cancelling the suggestion, the user who ordered
                            not will be notified and money will be refunded.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={closeModal}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={closeModal}>
                        Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DenyModal;
