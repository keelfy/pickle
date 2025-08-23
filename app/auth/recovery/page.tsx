import { AuthFormMessage, Message } from '@/components/auth-form-message'
import { SubmitButton } from '@/components/submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

type Props = {
  searchParams: Promise<Message>
}

export default async function ForgotPassword({ searchParams }: Props) {
  const message = await searchParams

  return (
    <>
      <form className="mx-auto flex w-full min-w-64 max-w-64 flex-1 flex-col gap-2 text-foreground [&>input]:mb-6">
        <div>
          <h1 className="text-2xl font-medium">Reset Password</h1>
          <p className="text-sm text-secondary-foreground">
            Already have an account?{' '}
            <Link className="text-primary underline" href="/auth/login">
              Sign in
            </Link>
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-2 [&>input]:mb-3">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
          <SubmitButton>Reset Password</SubmitButton>
          <AuthFormMessage message={message} />
        </div>
      </form>
    </>
  )
}
