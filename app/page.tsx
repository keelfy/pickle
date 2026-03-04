import { Button } from '@/components/ui/button'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pickle - Track What You Watch & Play',
}

export default function LandingPage() {
  return (
    <div className="flex h-svh w-screen flex-col items-center justify-center gap-10">
      <h1 className="font-mono text-4xl font-semibold">
        this is <span className="font-bold text-green-600">pickle</span> 🥒
      </h1>
      <div className="flex flex-col items-center justify-center gap-2">
        <h3 className="text-center text-xl">
          a platform to track <span className="font-bold">games</span>&nbsp;
          you&apos;ve played, <span className="font-bold">movies</span>&nbsp;
          you&apos;ve watched, and more.
        </h3>
        <p className="text-muted-foreground">
          or flex to your audience or friends.
        </p>
      </div>
      <Button
        className="bg-green-600 font-mono text-white hover:bg-green-700"
        size="lg"
        asChild
      >
        <Link href="/auth/login">get started</Link>
      </Button>
    </div>
  )
}
