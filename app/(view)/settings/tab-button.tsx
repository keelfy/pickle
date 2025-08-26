import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

type Props = {
  active: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  className?: string
  disabled?: boolean
}

export default function ProfileSettingsTabButton({
  icon: Icon,
  label,
  active,
  onClick,
  className,
  disabled = false,
}: Props) {
  return (
    <Button
      variant={active ? 'default' : 'ghost'}
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-start gap-2 text-sm',
        className,
      )}
      disabled={disabled}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
