import Link from 'next/link'
import React from 'react'
import Navbar from './navbar'

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="grid gap-10 py-4">
      <div className="container grid max-w-5xl gap-10">
        <Navbar />
        <main>{children}</main>
      </div>

      <footer className="flex h-fit items-center justify-center border-t py-6 text-center text-xs">
        <div className="flex flex-col items-center gap-2">
          <p>
            Powered&nbsp;by&nbsp;
            <Link
              href="https://pickle.pw/"
              target="_blank"
              className="font-bold decoration-muted-foreground underline-offset-2 hover:underline"
              rel="noreferrer"
            >
              pickle
            </Link>
          </p>
          <div>
            <Link
              href="/terms"
              target="_blank"
              className="decoration-muted-foreground underline-offset-2 hover:underline"
            >
              Terms of Service
            </Link>
            &nbsp;&bull;&nbsp;
            <Link
              href="/privacy"
              target="_blank"
              className="decoration-muted-foreground underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
