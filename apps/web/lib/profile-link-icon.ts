import PickleIcon from '@/components/ui/icons/pickle-icon'
import {
  SiTwitch,
  SiYoutube,
  SiX,
  SiInstagram,
  SiBoosty,
  SiTwitchHex,
  SiYoutubeHex,
  SiXHex,
  SiInstagramHex,
  SiBoostyHex,
  SiPatreon,
  SiPatreonHex,
  SiTiktok,
  SiTiktokHex,
  SiDiscord,
  SiDiscordHex,
  SiReddit,
  SiRedditHex,
  SiGithub,
  SiGithubHex,
  SiSteam,
  SiSteamHex,
  SiTelegram,
  SiTelegramHex,
  SiOnlyfans,
  SiOnlyfansHex,
  SiVk,
  SiVkHex,
  SiPinterest,
  SiPinterestHex,
} from '@icons-pack/react-simple-icons'
import { GlobeIcon } from 'lucide-react'
import { ProfileLink } from './model/user'

export const getProfileLinkIcon = (link: ProfileLink) => {
  const hostname = new URL(link.url).hostname.replace('www.', '').split('.')[0]
  const Icon =
    externalLinksIcons[hostname as keyof typeof externalLinksIcons] ?? GlobeIcon
  const IconHex =
    externalLinksIconsHex[hostname as keyof typeof externalLinksIconsHex] ??
    undefined
  const invertOnDarkTheme =
    invertOnDarkThemeMap[hostname as keyof typeof invertOnDarkThemeMap] ?? false
  return { Icon, IconHex, invertOnDarkTheme }
}

export const getOrdererAvatarIcon = (source: string) => {
  const Icon =
    externalLinksIcons[source as keyof typeof externalLinksIcons] ?? GlobeIcon
  const IconHex =
    externalLinksIconsHex[source as keyof typeof externalLinksIconsHex] ??
    undefined
  const invertOnDarkTheme =
    invertOnDarkThemeMap[source as keyof typeof invertOnDarkThemeMap] ?? false
  return { Icon, IconHex, invertOnDarkTheme }
}

const externalLinksIcons = {
  twitch: SiTwitch,
  youtube: SiYoutube,
  x: SiX,
  pinterest: SiPinterest,
  instagram: SiInstagram,
  boosty: SiBoosty,
  patreon: SiPatreon,
  tiktok: SiTiktok,
  discord: SiDiscord,
  reddit: SiReddit,
  github: SiGithub,
  steamcommunity: SiSteam,
  steam: SiSteam,
  t: SiTelegram,
  onlyfans: SiOnlyfans,
  vk: SiVk,
  pickle: PickleIcon,
}

const externalLinksIconsHex = {
  twitch: SiTwitchHex,
  youtube: SiYoutubeHex,
  x: SiXHex,
  instagram: SiInstagramHex,
  boosty: SiBoostyHex,
  patreon: SiPatreonHex,
  tiktok: SiTiktokHex,
  discord: SiDiscordHex,
  reddit: SiRedditHex,
  github: SiGithubHex,
  steamcommunity: SiSteamHex,
  steam: SiSteamHex,
  t: SiTelegramHex,
  onlyfans: SiOnlyfansHex,
  vk: SiVkHex,
  pinterest: SiPinterestHex,
  pickle: undefined,
}

const invertOnDarkThemeMap = {
  steamcommunity: true,
  steam: true,
  github: true,
  x: true,
}
