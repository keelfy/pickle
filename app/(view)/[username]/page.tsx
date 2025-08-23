import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ username: string }>
}

export default async function Page({ params }: Props) {
  const { username } = await params
  return redirect(`/${username}/notes/games`)
  return (
    <div className="flex flex-col gap-4">
      {/* <CollectionsSection username={username} /> */}
    </div>
  )
}
