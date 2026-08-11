---
name: new-page
description: Scaffold a Next.js App Router page (page.tsx) with optional loading.tsx and layout
---

# new-page

Scaffold a new Next.js App Router page with proper structure for Next.js 15 + React 19.

## Trigger

When the user asks to create a new page, route, or section of the app such as:
- "create a new page for /dashboard"
- "add a blog post page"
- "make a settings page"
- "create an about page"

## Instructions

1. **Determine the route path** from the user's description. Map it to the App Router directory structure under `app/`.

2. **Create `page.tsx`** at the appropriate path (e.g., `app/dashboard/page.tsx` for `/dashboard`).

   Structure:
   ```tsx
   import type { Metadata } from "next";

   export const metadata: Metadata = {
     title: "Page Title",
     description: "Brief description of the page.",
   };

   export default async function Page() {
     // Server component — data fetching, serializable props only
     return (
       <main className="container mx-auto px-4 py-8">
         <h1 className="text-2xl font-bold">Page Title</h1>
         <p>Content goes here.</p>
       </main>
     );
   }
   ```

   Rules:
   - Default export is an **async server component** by default.
   - Use `Metadata` type for page-level SEO (title, description, open graph).
   - Use Tailwind classes for styling (container, spacing, typography).
   - If the page needs data, fetch inside the async function and serialize results.

3. **Ask if a `loading.tsx` is needed.** If yes, create it alongside `page.tsx`:
   ```tsx
   export default function Loading() {
     return (
       <div className="flex items-center justify-center min-h-[60vh]">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
       </div>
     );
   }
   ```
   - `loading.tsx` renders a Suspense fallback for the route segment.
   - Keep it minimal — a spinner or skeleton is sufficient.

4. **Ask if a `layout.tsx` is needed for this segment.** If yes, create it:
   ```tsx
   export default function Layout({ children }: { children: React.ReactNode }) {
     return (
       <section className="container mx-auto px-4 py-8">
         {children}
       </section>
     );
   }
   ```
   - Layouts wrap child pages and loading states in a Suspense boundary.
   - Accept `children` as the only prop typed as `React.ReactNode`.

5. **Do NOT create** `error.tsx` or `not-found.tsx` unless explicitly requested.

6. **Do NOT add client components** (`"use client"`) to `page.tsx` unless the user explicitly needs interactivity. Pages should be server components by default.

7. **Report the file paths** created to the user.
