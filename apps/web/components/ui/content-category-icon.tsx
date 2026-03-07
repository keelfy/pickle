import { ContentCategory, ContentCategoryEnum } from '@/lib/model/content'
import { SiYoutube } from '@icons-pack/react-simple-icons'
import {
  ClapperboardIcon,
  GamepadIcon,
  ListVideo,
  SquirrelIcon,
  TvIcon,
} from 'lucide-react'

type Props = {
  category: ContentCategory
  className?: string
}

export const getContentCategoryIcon = (category: ContentCategory) => {
  if (category === ContentCategoryEnum.Games) {
    return GamepadIcon
  } else if (category === ContentCategoryEnum.Videos) {
    return SiYoutube
  } else if (category === ContentCategoryEnum.Movies) {
    return ClapperboardIcon
  } else if (category === ContentCategoryEnum.Anime) {
    return SquirrelIcon
  } else if (category === ContentCategoryEnum.Series) {
    return TvIcon
  } else {
    return ListVideo
  }
}

export default function ContentCategoryIcon({ category, className }: Props) {
  if (category === ContentCategoryEnum.Games) {
    return <GamepadIcon className={className} />
  } else if (category === ContentCategoryEnum.Videos) {
    return <SiYoutube className={className} />
  } else if (category === ContentCategoryEnum.Movies) {
    return <ClapperboardIcon className={className} />
  } else if (category === ContentCategoryEnum.Anime) {
    return <SquirrelIcon className={className} />
  } else if (category === ContentCategoryEnum.Series) {
    return <TvIcon className={className} />
  }
  return <ListVideo className={className} />
}
