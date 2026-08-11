---
name: new-component
description: Scaffold a React server or client component with Tailwind styling
---

# new-component

Scaffold a new React component with proper structure and Tailwind CSS styling for Next.js 15 + React 19.

## Trigger

When the user asks to create a component, UI element, or reusable piece of JSX such as:
- "create a card component"
- "make a button component"
- "add a header/navbar component"
- "create a reusable form input"
- "build a sidebar component"

## Instructions

1. **Determine if the component is a Server Component or Client Component.**

   - **Server Component (default):** If the component only renders JSX, fetches data, or composes other components without interactivity, create it as a server component.
   - **Client Component:** If the component uses `useState`, `useEffect`, event handlers (`onClick`, `onSubmit`), browser APIs, or third-party interactive libraries, add `"use client"` at the top.

2. **Place the component** in the appropriate directory:
   - Shared UI components: `components/` (e.g., `components/ui/button.tsx`)
   - Page-specific components: co-locate near the page in `app/`
   - Feature components: `components/feature-name/`

3. **Create the component file** with the following structure.

   **Server Component example:**
   ```tsx
   interface CardProps {
     title: string;
     description: string;
     href?: string;
   }

   export default function Card({ title, description, href }: CardProps) {
     const element = href ? (
       <a
         href={href}
         className="block h-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:bg-gray-50"
       >
         <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
         <p className="mt-2 text-sm text-gray-600">{description}</p>
       </a>
     ) : (
       <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
         <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
         <p className="mt-2 text-sm text-gray-600">{description}</p>
       </div>
     );

     return element;
   }
   ```

   **Client Component example:**
   ```tsx
   "use client";

   import { useState } from "react";

   interface ToggleButtonProps {
     label: string;
     defaultChecked?: boolean;
     onChange?: (checked: boolean) => void;
   }

   export default function ToggleButton({ label, defaultChecked = false, onChange }: ToggleButtonProps) {
     const [checked, setChecked] = useState(defaultChecked);

     function handleChange() {
       const next = !checked;
       setChecked(next);
       onChange?.(next);
     }

     return (
       <button
         onClick={handleChange}
         className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
           checked
             ? "bg-blue-600 text-white"
             : "bg-gray-200 text-gray-700"
         }`}
         role="switch"
         aria-checked={checked}
       >
         {label}
       </button>
     );
   }
   ```

   Rules:
   - Define TypeScript interfaces for all props. Use `interface` not `type` for component props.
   - Use optional chaining (`onChange?.()`) for optional callbacks.
   - Use Tailwind CSS for all styling — no inline styles or CSS modules unless explicitly requested.
   - Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<section>`) over generic `<div>`s.
   - Include `aria-*` attributes for accessibility when adding interactivity.
   - Keep components focused: one responsibility per component.
   - Default exports for components; named exports for utility functions within the file.

4. **For component variants** (e.g., button sizes, card styles), use conditional class merging:
   ```tsx
   const sizeClasses = {
     sm: "px-3 py-1 text-sm",
     md: "px-4 py-2 text-base",
     lg: "px-6 py-3 text-lg",
   }[size];
   ```

5. **Report the file path** created to the user.
