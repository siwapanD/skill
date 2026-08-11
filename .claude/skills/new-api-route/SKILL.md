---
name: new-api-route
description: Scaffold a Next.js App Router Route Handler (route.ts) with standard NextResponse patterns
---

# new-api-route

Scaffold a new Next.js App Router API route handler with proper structure for Next.js 15 + React 19.

## Trigger

When the user asks to create an API route, endpoint, or handler such as:
- "create an API route for /api/users"
- "add a POST endpoint"
- "make a REST API handler"
- "create a webhook endpoint"

## Instructions

1. **Determine the route path** from the user's description. Map it to `app/api/` directory structure.

2. **Create `route.ts`** at the appropriate path (e.g., `app/api/users/route.ts` for `/api/users`).

   Structure:
   ```tsx
   import { NextResponse } from "next/server";
   import type { NextRequest } from "next/server";

   export async function GET(request: NextRequest) {
     try {
       // Parse query params
       const searchParams = request.nextUrl.searchParams;
       const id = searchParams.get("id");

       // Fetch data (use a server-side data source)
       const data = await fetchData(id);

       return NextResponse.json({ data });
     } catch (error) {
       console.error("GET error:", error);
       return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
       );
     }
   }

   export async function POST(request: NextRequest) {
     try {
       const body = await request.json();

       // Validate input
       if (!body.requiredField) {
         return NextResponse.json(
           { error: "Missing required field" },
           { status: 400 }
         );
       }

       // Process the request
       const result = await processData(body);

       return NextResponse.json({ result }, { status: 201 });
     } catch (error) {
       console.error("POST error:", error);
       return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
       );
     }
   }
   ```

   Rules:
   - Use `NextResponse.json()` for all JSON responses.
   - Use `NextRequest` type for typed request access (headers, searchParams, url).
   - Always wrap logic in try/catch and return appropriate HTTP status codes.
   - Use `200` for successful GET, `201` for successful POST creation, `400` for bad requests, `404` for not found, `500` for server errors.
   - Log errors with `console.error` before returning 500 responses.
   - Do NOT use `"use client"` — API routes are always server-side.

3. **For nested routes** (e.g., `/api/users/[id]`), create a `route.ts` inside a directory with brackets:
   ```tsx
   import { NextResponse } from "next/server";
   import type { NextRequest } from "next/server";

   export async function GET(
     request: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params;
     // Handle by-id logic
   }
   ```

   Note: In Next.js 15, `params` (and `searchParams` in pages) are `Promise`s — type them as
   `Promise<{ ... }>` and `await` before use. This is a breaking change from Next.js 14.

4. **For DELETE/PATCH/PUT methods**, add corresponding exports following the same try/catch pattern.

5. **Report the file path** created to the user.
