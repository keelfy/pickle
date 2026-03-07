import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{
    username: string
  }>
}

export default async function ContentNoteGridPage({ params }: Props) {
  const { username } = await params
  return redirect(`/${username}/notes/games`)
}
