import { ContentWebsite } from '@/lib/model/content'
import {
  SiDiscord,
  SiDiscordHex,
  SiImdb,
  SiImdbHex,
  SiItchdotio,
  SiItchdotioHex,
  SiReddit,
  SiRedditHex,
  SiSteam,
  SiSteamHex,
  SiThemoviedatabase,
  SiThemoviedatabaseHex,
  SiTwitch,
  SiTwitchHex,
  SiWikipedia,
  SiWikipediaHex,
  SiYoutube,
  SiYoutubeHex,
} from '@icons-pack/react-simple-icons'
import Link from 'next/link'

export default function getContentSourceLinks(websites: ContentWebsite[]) {
  return websites?.map((w) => {
    switch (w.type.toLowerCase()) {
      case 'tmdb':
        return (
          <Link href={w.url} target="_blank" key={w.type}>
            <SiThemoviedatabase
              className="size-7"
              color={SiThemoviedatabaseHex}
            />
          </Link>
        )
      case 'imdb':
        return (
          <Link href={w.url} target="_blank" key={w.type}>
            <SiImdb className="size-7" color={SiImdbHex} />
          </Link>
        )
      case 'steam':
        return (
          <Link href={w.url} target="_blank" key={w.type}>
            <SiSteam className="size-5 dark:invert" color={SiSteamHex} />
          </Link>
        )
      case 'wikipedia':
        return (
          <Link href={w.url} target="_blank" key={w.type}>
            <SiWikipedia
              className="size-5 dark:invert"
              color={SiWikipediaHex}
            />
          </Link>
        )
      case 'itch':
        return (
          <Link href={w.url} target="_blank" key={w.type}>
            <SiItchdotio className="size-5" color={SiItchdotioHex} />
          </Link>
        )
      case 'twitch':
        return (
          <Link href={w.url} target="_blank" key={w.type}>
            <SiTwitch className="size-5" color={SiTwitchHex} />
          </Link>
        )
      case 'subreddit':
        return (
          <Link href={w.url} target="_blank" key={w.type}>
            <SiReddit className="size-5" color={SiRedditHex} />
          </Link>
        )
      case 'youtube':
        return (
          <Link href={w.url} target="_blank" key={w.type}>
            <SiYoutube className="size-5" color={SiYoutubeHex} />
          </Link>
        )
      case 'discord':
        return (
          <Link href={w.url} target="_blank" key={w.type}>
            <SiDiscord className="size-5" color={SiDiscordHex} />
          </Link>
        )
    }
  })
}
