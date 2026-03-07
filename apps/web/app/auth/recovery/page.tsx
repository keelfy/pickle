import { AuthFormMessage, Message } from '@/components/auth-form-message'
import { SubmitButton } from '@/components/submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

type Props = {
  searchParams: Promise<Message>
}

export default async function ForgotPassword({ searchParams }: Props) {
  const t = await getTranslations('auth.recovery')
  const tAuth = await getTranslations('auth')
  const message = await searchParams

  return (
    <>
      <form className="mx-auto flex w-full min-w-64 max-w-64 flex-1 flex-col gap-2 text-foreground [&>input]:mb-6">
        <div>
          <h1 className="text-2xl font-medium">{t('title')}</h1>
          <p className="text-sm text-secondary-foreground">
            {t('alreadyHaveAccount')}{' '}
            <Link className="text-primary underline" href="/auth/login">
              {tAuth('signIn')}
            </Link>
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-2 [&>input]:mb-3">
          <Label htmlFor="email">{t('emailLabel')}</Label>
          <Input name="email" placeholder={t('emailPlaceholder')} required />
          <SubmitButton>{t('submit')}</SubmitButton>
          <AuthFormMessage message={message} />
        </div>
      </form>
    </>
  )
}
