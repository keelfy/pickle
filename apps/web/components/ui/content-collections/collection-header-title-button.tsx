import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  name: string
  className?: string
}

export default function CollectionHeaderTitleButton({
  name,
  className,
  ...props
}: Props) {
  return (
    <Button
      variant="link"
      className={cn(
        'flex flex-shrink-0 items-center gap-2 p-0 text-start text-lg font-semibold',
        className,
      )}
      {...props}
    >
      {name}
    </Button>
  )
}
