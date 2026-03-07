import { AuthFormMessage, Message } from '@/components/auth-form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NextPage } from 'next'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<Message>
}

const ResetPassword: NextPage<Props> = async ({ searchParams }) => {
  const message = await searchParams

  return (
    <form className="flex w-full max-w-md flex-col gap-2 p-4 [&>input]:mb-4">
      <h1 className="text-2xl font-medium">Reset password</h1>
      <p className="text-sm text-foreground/60">
        Please enter your new password below.
      </p>
      <Label htmlFor="password">New password</Label>
      <Input
        type="password"
        name="password"
        placeholder="New password"
        required
      />
      <Label htmlFor="confirmPassword">Confirm password</Label>
      <Input
        type="password"
        name="confirmPassword"
        placeholder="Confirm password"
        required
      />
      {/* <SubmitButton formAction={resetPasswordAction}>
                Reset password
            </SubmitButton> */}
      <AuthFormMessage message={message} />
    </form>
  )
}

export default ResetPassword
