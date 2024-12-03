import { Message } from "@/components/form-message";
import LoginForm from "@/components/login-form";

type Props = {
    searchParams: Promise<Message>;
};

const LoginPage = async ({ searchParams }: Props) => {
    const message = await searchParams;

    return (
        <div className="flex h-screen w-screen items-center justify-center px-4">
            <LoginForm message={message} />
        </div>
    );
};

export default LoginPage;
