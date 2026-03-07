# Phase 5: SEO & Metadata

**Goal:** Improve discoverability on search engines and rich previews when links are shared on social media.

**Effort:** ~2-3 hours | ~8 files touched | Low risk

**Depends on:** Phase 3 (for server-side data availability patterns)

## Tasks

### 5.1 Improve root metadata

**File:** `app/layout.tsx`

Replace the minimal metadata (currently just `title: "pickle"`, `description: "The pickle website"`) with comprehensive metadata:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(`https://${process.env.NEXT_PUBLIC_DOMAIN}`),
  title: {
    default: "Pickle — Track What You Watch & Play",
    template: "%s | Pickle",
  },
  description:
    "Your personal space to track games, movies, series, and anime. Share your opinions and stay in touch with your audience.",
  openGraph: {
    type: "website",
    siteName: "Pickle",
    title: "Pickle — Track What You Watch & Play",
    description:
      "Your personal space to track games, movies, series, and anime. Share your opinions and stay in touch with your audience.",
    // Add a default OG image if available
    // images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pickle — Track What You Watch & Play",
    description:
      "Your personal space to track games, movies, series, and anime.",
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### 5.2 Add page-level metadata

Add `metadata` exports to pages that currently lack them:

**`app/page.tsx` (landing page):**

```typescript
export const metadata: Metadata = {
  title: "Pickle — Track What You Watch & Play",
  // Uses the root template, so this becomes the default
};
```

**`app/(view)/settings/page.tsx`:**

```typescript
export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false }, // Don't index settings pages
};
```

**`app/(view)/suggest/[username]/page.tsx`:**

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: `Suggest content to ${params.username}`,
    description: `Submit a content suggestion to ${params.username} on Pickle.`,
    robots: { index: false }, // Suggestion pages are user-specific
  };
}
```

**Auth pages (`app/auth/login/page.tsx`, etc.):**

```typescript
export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false },
};
```

### 5.3 Add content note metadata

**File:** `app/(view)/[username]/notes/[category]/[id]/page.tsx`

Add `generateMetadata` to generate rich previews for individual content notes when shared:

```typescript
export async function generateMetadata({
  params,
}: {
  params: { username: string; category: string; id: string };
}): Promise<Metadata> {
  try {
    const profile = await fetchProfileByUsername(params.username);
    const note = await fetchContentNote(profile.id, params.category, params.id);

    const title = `${note.content.title} — ${profile.displayName}'s review`;
    const description = note.review
      ? note.review.substring(0, 160)
      : `${profile.displayName} rated ${note.content.title}`;

    return {
      title,
      description,
      openGraph: {
        type: "article",
        title,
        description,
        images: note.content.coverUrl
          ? [{ url: note.content.coverUrl }]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return { title: "Content Note" };
  }
}
```

### 5.4 Add JSON-LD structured data

Add structured data schemas for search engine understanding.

**Profile pages — `app/(view)/[username]/layout.tsx`:**

Add a `<script type="application/ld+json">` tag with `ProfilePage` schema:

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: {
    '@type': 'Person',
    name: profile.displayName,
    alternateName: profile.username,
    url: `https://${process.env.NEXT_PUBLIC_DOMAIN}/${profile.username}`,
    image: profile.avatarUrl,
    description: profile.bio,
  },
};

// In the JSX:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

**Content note pages — `app/(view)/[username]/notes/[category]/[id]/page.tsx`:**

Add `Review` schema:

```typescript
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Review",
  author: {
    "@type": "Person",
    name: profile.displayName,
  },
  itemReviewed: {
    "@type": categoryToSchemaType(note.content.category), // 'VideoGame', 'Movie', etc.
    name: note.content.title,
  },
  reviewBody: note.review,
  // If rating exists:
  reviewRating: note.rating
    ? {
        "@type": "Rating",
        ratingValue: note.rating,
        bestRating: 10,
      }
    : undefined,
};
```

Create a utility `lib/schema-org.ts` to map content categories to Schema.org types:

```typescript
export function categoryToSchemaType(category: ContentCategory): string {
  const map: Record<ContentCategory, string> = {
    games: "VideoGame",
    movies: "Movie",
    series: "TVSeries",
    anime: "TVSeries",
    youtube: "VideoObject",
  };
  return map[category] ?? "CreativeWork";
}
```

## Verification

- `bun run build` completes successfully
- View page source on profile pages -> see OpenGraph meta tags and JSON-LD script
- Share a profile URL on Discord/Telegram -> shows rich preview with avatar and description
- Share a content note URL -> shows the content cover image and review snippet
- Google Structured Data Testing Tool validates the JSON-LD schemas
