import { ContentNoteStatus } from '@/lib/model/content-note'
import {
  CheckCheckIcon,
  FastForwardIcon,
  ImageOffIcon,
  LoaderIcon,
  PauseIcon,
  SkipBackIcon,
} from 'lucide-react'

type Props = React.ComponentProps<'svg'> & {
  status: ContentNoteStatus
}

export const ContentNoteStatusIcon = ({ status, className }: Props) => {
  if (status === 'dropped') {
    return <ImageOffIcon className={className} />
  } else if (status === 'finished' || status === 'watched') {
    return <CheckCheckIcon className={className} />
  } else if (status === 'playing') {
    return <LoaderIcon className={className} />
  } else if (status === 'paused') {
    return <PauseIcon className={className} />
  } else if (status === 'planned') {
    return <FastForwardIcon className={className} />
  } else if (status === 'skipped') {
    return <SkipBackIcon className={className} />
  }
  return null
}
