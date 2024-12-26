import { signUpAction } from "@/app/actions";
import { AuthFormMessage, Message } from "@/components/auth-form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import AuthForm from "@/components/auth-form";

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
