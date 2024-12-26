import AuthForm from "@/components/auth-form";
import { Message } from "@/components/auth-form-message";

type Props = {
    searchParams: Promise<Message>;
};

export default async function SignInPage({ searchParams }: Props) {
    const message = await searchParams;

    return (
        <AuthForm
            message={message}
            registration={false}
            className="mx-auto flex-1"
        />
    );
}
