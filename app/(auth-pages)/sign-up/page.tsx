import AuthForm from "@/components/auth-form";
import { Message } from "@/components/auth-form-message";

type Props = {
    searchParams: Promise<Message>;
};

export default async function SignUpPage({ searchParams }: Props) {
    const message = await searchParams;

    return (
        <AuthForm
            message={message}
            registration={true}
            className="mx-auto flex-1"
        />
    );
}
