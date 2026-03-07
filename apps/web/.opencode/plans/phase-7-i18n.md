# Phase 7: Internationalization (i18n)

**Goal:** Set up English + Russian localization using `next-intl`, the most popular i18n library for Next.js App Router.

**Effort:** ~8-10 hours | ~50+ files touched | Medium risk (touches many files but changes are mechanical)

**Depends on:** Phase 6 (a11y fixes UI strings that i18n will also touch)

## Why `next-intl`?

- First-class support for Next.js App Router (server and client components)
- Built-in pluralization, date/number formatting, rich text
- Type-safe message keys with TypeScript
- URL-based locale routing (e.g., `/en/username` or `/ru/username`)
- Active maintenance and large community

## Tasks

### 7.1 Install and configure `next-intl`

```bash
bun add next-intl
```

**Create `i18n/config.ts`:**

```typescript
export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
```

**Create `i18n/request.ts`:**

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**Create `i18n/routing.ts`:**

```typescript
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "ru"],
  defaultLocale: "en",
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

**Update `next.config.js`:**

```javascript
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // existing config...
};

module.exports = withNextIntl(nextConfig);
```

**Update `middleware.ts`:**

Integrate `next-intl` middleware with the existing Ory middleware. `next-intl` provides `createMiddleware` that handles locale detection and routing.

### 7.2 Create message file structure

**Create `messages/en.json`:**

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try again",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "noResults": "No results found",
    "confirm": "Confirm"
  },
  "nav": {
    "home": "Home",
    "settings": "Settings",
    "signIn": "Sign in",
    "signOut": "Sign out",
    "notifications": "Notifications",
    "menu": "Menu"
  },
  "auth": {
    "login": {
      "title": "Log in",
      "email": "Email",
      "password": "Password",
      "submit": "Log in",
      "forgotPassword": "Forgot password?",
      "noAccount": "Don't have an account?",
      "register": "Sign up"
    },
    "registration": {
      "title": "Create account",
      "email": "Email",
      "password": "Password",
      "confirmPassword": "Confirm password",
      "submit": "Create account",
      "hasAccount": "Already have an account?",
      "login": "Log in"
    },
    "recovery": {
      "title": "Reset password",
      "description": "Enter your email to receive a recovery link"
    },
    "verification": {
      "title": "Verify your email"
    }
  },
  "profile": {
    "followers": "{count, plural, one {# follower} other {# followers}}",
    "following": "Following",
    "follow": "Follow",
    "unfollow": "Unfollow",
    "editProfile": "Edit profile",
    "shareProfile": "Share profile",
    "reportProfile": "Report profile",
    "tabs": {
      "games": "Games",
      "movies": "Movies",
      "series": "Series",
      "anime": "Anime",
      "youtube": "YouTube",
      "suggestions": "Suggestions"
    }
  },
  "contentNote": {
    "status": {
      "completed": "Completed",
      "inProgress": "In progress",
      "planned": "Planned",
      "dropped": "Dropped",
      "onHold": "On hold"
    },
    "sort": {
      "newest": "Newest",
      "oldest": "Oldest",
      "rating": "Rating",
      "title": "Title"
    },
    "filter": {
      "all": "All",
      "status": "Status",
      "rating": "Rating"
    },
    "create": "Add note",
    "edit": "Edit note",
    "delete": "Delete note",
    "deleteConfirm": "Are you sure you want to delete this note?",
    "review": "Review",
    "rating": "Rating",
    "noNotes": "No content notes yet"
  },
  "suggestions": {
    "title": "Suggestions",
    "suggest": "Suggest content",
    "approve": "Accept",
    "deny": "Reject",
    "pending": "Pending",
    "approved": "Accepted",
    "denied": "Rejected",
    "noSuggestions": "No suggestions yet",
    "submitSuggestion": "Submit suggestion",
    "message": "Message (optional)"
  },
  "collections": {
    "title": "Collections",
    "create": "Create collection",
    "edit": "Edit collection",
    "delete": "Delete collection",
    "addItem": "Add to collection",
    "removeItem": "Remove from collection",
    "noCollections": "No collections yet"
  },
  "settings": {
    "title": "Settings",
    "tabs": {
      "general": "General",
      "security": "Security",
      "moderation": "Moderation",
      "suggestions": "Suggestions",
      "twitch": "Twitch"
    },
    "general": {
      "displayName": "Display name",
      "bio": "Bio",
      "avatar": "Avatar",
      "language": "Language",
      "theme": "Theme"
    }
  },
  "errors": {
    "notFound": "Page not found",
    "profileNotFound": "Profile not found",
    "somethingWentWrong": "Something went wrong",
    "unauthorized": "You need to log in to do this",
    "networkError": "Network error. Please try again."
  },
  "time": {
    "justNow": "just now",
    "minutesAgo": "{count, plural, one {# minute ago} other {# minutes ago}}",
    "hoursAgo": "{count, plural, one {# hour ago} other {# hours ago}}",
    "daysAgo": "{count, plural, one {# day ago} other {# days ago}}"
  }
}
```

**Create `messages/ru.json`:**

```json
{
  "common": {
    "loading": "Загрузка...",
    "error": "Что-то пошло не так",
    "retry": "Попробовать снова",
    "save": "Сохранить",
    "cancel": "Отмена",
    "delete": "Удалить",
    "edit": "Редактировать",
    "create": "Создать",
    "search": "Поиск",
    "noResults": "Ничего не найдено",
    "confirm": "Подтвердить"
  },
  "nav": {
    "home": "Главная",
    "settings": "Настройки",
    "signIn": "Войти",
    "signOut": "Выйти",
    "notifications": "Уведомления",
    "menu": "Меню"
  },
  "auth": {
    "login": {
      "title": "Вход",
      "email": "Электронная почта",
      "password": "Пароль",
      "submit": "Войти",
      "forgotPassword": "Забыли пароль?",
      "noAccount": "Нет аккаунта?",
      "register": "Зарегистрироваться"
    },
    "registration": {
      "title": "Создание аккаунта",
      "email": "Электронная почта",
      "password": "Пароль",
      "confirmPassword": "Подтвердите пароль",
      "submit": "Создать аккаунт",
      "hasAccount": "Уже есть аккаунт?",
      "login": "Войти"
    },
    "recovery": {
      "title": "Сброс пароля",
      "description": "Введите email для получения ссылки на восстановление"
    },
    "verification": {
      "title": "Подтвердите email"
    }
  },
  "profile": {
    "followers": "{count, plural, one {# подписчик} few {# подписчика} many {# подписчиков} other {# подписчиков}}",
    "following": "Подписки",
    "follow": "Подписаться",
    "unfollow": "Отписаться",
    "editProfile": "Редактировать профиль",
    "shareProfile": "Поделиться профилем",
    "reportProfile": "Пожаловаться",
    "tabs": {
      "games": "Игры",
      "movies": "Фильмы",
      "series": "Сериалы",
      "anime": "Аниме",
      "youtube": "YouTube",
      "suggestions": "Предложения"
    }
  },
  "contentNote": {
    "status": {
      "completed": "Пройдено",
      "inProgress": "В процессе",
      "planned": "Запланировано",
      "dropped": "Брошено",
      "onHold": "Отложено"
    },
    "sort": {
      "newest": "Сначала новые",
      "oldest": "Сначала старые",
      "rating": "По оценке",
      "title": "По названию"
    },
    "filter": {
      "all": "Все",
      "status": "Статус",
      "rating": "Оценка"
    },
    "create": "Добавить заметку",
    "edit": "Редактировать заметку",
    "delete": "Удалить заметку",
    "deleteConfirm": "Вы уверены, что хотите удалить эту заметку?",
    "review": "Отзыв",
    "rating": "Оценка",
    "noNotes": "Заметок пока нет"
  },
  "suggestions": {
    "title": "Предложения",
    "suggest": "Предложить контент",
    "approve": "Принять",
    "deny": "Отклонить",
    "pending": "Ожидает",
    "approved": "Принято",
    "denied": "Отклонено",
    "noSuggestions": "Предложений пока нет",
    "submitSuggestion": "Отправить предложение",
    "message": "Сообщение (необязательно)"
  },
  "collections": {
    "title": "Коллекции",
    "create": "Создать коллекцию",
    "edit": "Редактировать коллекцию",
    "delete": "Удалить коллекцию",
    "addItem": "Добавить в коллекцию",
    "removeItem": "Убрать из коллекции",
    "noCollections": "Коллекций пока нет"
  },
  "settings": {
    "title": "Настройки",
    "tabs": {
      "general": "Основные",
      "security": "Безопасность",
      "moderation": "Модерация",
      "suggestions": "Предложения",
      "twitch": "Twitch"
    },
    "general": {
      "displayName": "Имя",
      "bio": "О себе",
      "avatar": "Аватар",
      "language": "Язык",
      "theme": "Тема"
    }
  },
  "errors": {
    "notFound": "Страница не найдена",
    "profileNotFound": "Профиль не найден",
    "somethingWentWrong": "Что-то пошло не так",
    "unauthorized": "Необходимо войти в аккаунт",
    "networkError": "Ошибка сети. Попробуйте ещё раз."
  },
  "time": {
    "justNow": "только что",
    "minutesAgo": "{count, plural, one {# минуту назад} few {# минуты назад} many {# минут назад} other {# минут назад}}",
    "hoursAgo": "{count, plural, one {# час назад} few {# часа назад} many {# часов назад} other {# часов назад}}",
    "daysAgo": "{count, plural, one {# день назад} few {# дня назад} many {# дней назад} other {# дней назад}}"
  }
}
```

### 7.3 Extract UI strings — navigation & layout

Replace hardcoded strings with `useTranslations()` (client) or `getTranslations()` (server):

**Files to update:**

- `app/(view)/navbar.tsx` — menu items, sign in/out, notifications
- `app/(view)/[username]/layout.tsx` — follower count, tab names, edit profile button
- `app/(view)/layout.tsx` — footer text if any
- `app/(view)/settings/page.tsx` — tab labels
- `lib/menuList.ts` — sidebar menu labels

**Example (client component):**

```typescript
import { useTranslations } from 'next-intl';

function ProfileTabs() {
  const t = useTranslations('profile.tabs');

  return (
    <Tabs>
      <Tab>{t('games')}</Tab>
      <Tab>{t('movies')}</Tab>
      {/* ... */}
    </Tabs>
  );
}
```

**Example (server component):**

```typescript
import { getTranslations } from "next-intl/server";

export default async function Navbar() {
  const t = await getTranslations("nav");
  // ...
}
```

### 7.4 Extract UI strings — dialogs

Update all dialog components to use translation keys:

**Files to update (key ones):**

- `components/view/dialog/content-note-form/` — form labels, buttons, validation messages
- `components/view/dialog/create-order/` — suggestion form labels
- `components/view/dialog/select-content-item/` — search placeholder, no results text
- `components/view/dialog/profile-search/` — search placeholder
- `components/view/dialog/confirm-delete/` — confirmation text
- All other dialog components with user-facing text

### 7.5 Extract UI strings — auth pages

**Files to update:**

- `app/auth/login/page.tsx` and `app/auth/components/auth-form.tsx`
- `app/auth/registration/page.tsx`
- `app/auth/recovery/page.tsx`
- `app/auth/verification/page.tsx`
- `app/auth/error/page.tsx`

### 7.6 Extract UI strings — content & domain terms

Replace the existing localization helpers with `next-intl` equivalents:

**`lib/localize-types.ts`:**

- Currently has functions like `localizeCategory()`, `localizeStatus()`, `timeAgo()`
- Replace these with calls to `useTranslations('contentNote.status')`, `useTranslations('profile.tabs')`, etc.
- The `timeAgo()` function should use `useFormatter()` from `next-intl` for relative time formatting

**`utils/api/constants.ts`:**

- Label mappings for content categories and note statuses
- Replace with references to message keys

### 7.7 Wire up language dropdown

**File:** The existing `LanguageDropdownMenu` component

Connect it to `next-intl`'s locale switching:

```typescript
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';

function LanguageDropdownMenu() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {locale === 'en' ? 'English' : 'Русский'}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => switchLocale('en')}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLocale('ru')}>
          Русский
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Route Structure

After `next-intl` integration, URLs will follow the pattern:

- `/en/username/notes/games` (English)
- `/ru/username/notes/games` (Russian)
- `/username/notes/games` (redirects to default locale)

The `[locale]` segment is handled by `next-intl`'s middleware and does not require restructuring the `app/` directory if using the middleware-based approach.

## Verification

- `bun run build` completes successfully
- All pages render correctly in English (default)
- Switch to Russian via the language dropdown -> all UI strings change
- Pluralization works correctly:
  - English: "1 follower", "2 followers"
  - Russian: "1 подписчик", "2 подписчика", "5 подписчиков"
- `timeAgo` displays correctly in both languages
- URL reflects the current locale
- Refreshing the page preserves the selected locale
