'use client'

import { cn } from '@/lib/utils'
import { EarthIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuContent,
} from './ui/dropdown-menu'

type Props = {
  variant?: 'short' | 'default'
  className?: string
}

export default function LanguageDropdownMenu({
  variant = 'default',
  className,
}: Props) {
  const t = useTranslations('language')
  const locale = useLocale()
  const router = useRouter()
  const [, startTransition] = useTransition()

  const onLocaleChange = (nextLocale: 'en' | 'ru') => {
    if (nextLocale === locale) return

    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn('px-2', className)}>
          <div className="flex items-center gap-1">
            <EarthIcon />
            {variant === 'short'
              ? t(`short.${locale as 'en' | 'ru'}`)
              : locale === 'ru'
                ? t('russian')
                : t('english')}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => onLocaleChange(value as 'en' | 'ru')}
        >
          <DropdownMenuRadioItem value="en">{t('english')}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ru">{t('russian')}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="es" disabled>
            Espanol
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
