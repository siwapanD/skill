---
name: new-server-action
description: Scaffold a Next.js Server Action with Zod validation
---

# new-server-action

Scaffold a Next.js Server Action with Zod schema validation for Next.js 15 + React 19.

## Trigger

When the user asks to create a server action, form action, mutation handler, or anything that processes form data on the server such as:
- "create a server action for user signup"
- "add a form submission handler"
- "make a server action to update settings"
- "create a form action with validation"

## Instructions

1. **Determine the action's purpose** and the data it needs to accept.

2. **Create a Zod schema** for validation. Place it in a shared `lib/` directory (e.g., `lib/schemas/user.ts`):
   ```tsx
   import { z } from "zod";

   export const CreateUserSchema = z.object({
     name: z.string().min(1, "Name is required").max(100),
     email: z.string().email("Invalid email address"),
     password: z.string().min(8, "Password must be at least 8 characters"),
   });

   export type CreateUserInput = z.infer<typeof CreateUserSchema>;
   ```

   Rules:
   - Export both the schema and the inferred TypeScript type.
   - Use descriptive names: `<Action>Schema` and `<Action>Input`.
   - Place schemas in `lib/schemas/` or co-locate with the action in `lib/actions/`.

3. **Create the server action** in `lib/actions/` (e.g., `lib/actions/user.ts`):
   ```tsx
   "use server";

   import { revalidatePath } from "next/cache";
   import { CreateUserSchema, type CreateUserInput } from "@/lib/schemas/user";

   export async function createUser(data: unknown): Promise<{
     success: boolean;
     data?: CreateUserInput;
     error?: string;
   }> {
     const validationResult = CreateUserSchema.safeParse(data);

     if (!validationResult.success) {
       return {
         success: false,
         error: validationResult.error.errors[0]?.message ?? "Validation failed",
       };
     }

     const validatedData = validationResult.data;

     try {
       // Perform the server-side operation (DB write, API call, etc.)
       // const result = await db.user.create({ data: validatedData });

       revalidatePath("/users");

       return { success: true, data: validatedData };
     } catch (error) {
       console.error("createUser error:", error);
       return {
         success: false,
         error: "Failed to create user. Please try again.",
       };
     }
   }
   ```

   Rules:
   - Always start with `"use server"` directive at the top (first line, no comments before it).
   - Accept `unknown` as the parameter type — validate inside with Zod.
   - Return a consistent shape: `{ success: boolean; data?: T; error?: string }`.
   - Use `revalidatePath()` after successful mutations to invalidate Next.js cache.
   - Use `revalidatePath()` not `revalidateTag()` unless tags are already set up.
   - Import Zod from the installed package (not from a vendored copy).
   - Use `@/` path alias for internal imports.

4. **Show usage in a client component** if the user needs it:
   ```tsx
   "use client";

   import { useState } from "react";
   import { createUser } from "@/lib/actions/user";

   export default function UserForm() {
     const [loading, setLoading] = useState(false);
     const [message, setMessage] = useState("");

     async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
       event.preventDefault();
       setLoading(true);
       setMessage("");

       const formData = new FormData(event.currentTarget);
       const result = await createUser(Object.fromEntries(formData));

       if (result.success) {
         setMessage("User created successfully!");
       } else {
         setMessage(result.error ?? "Something went wrong");
       }

       setLoading(false);
     }

     return (
       <form onSubmit={handleSubmit} className="space-y-4">
         <input name="name" placeholder="Name" className="border p-2 rounded w-full" />
         <input name="email" type="email" placeholder="Email" className="border p-2 rounded w-full" />
         <button
           type="submit"
           disabled={loading}
           className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
         >
           {loading ? "Creating..." : "Create User"}
         </button>
         {message && <p className="text-sm">{message}</p>}
       </form>
     );
   }
   ```

5. **Report the file paths** created to the user.
