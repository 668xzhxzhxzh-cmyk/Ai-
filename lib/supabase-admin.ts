import { createClient } from "@supabase/supabase-js";
import { ProxyAgent, fetch as undiciFetch } from "undici";

function cleanEnv(name: string) {
  return process.env[name]?.trim();
}

export function createServerFetch() {
  const proxyUrl = process.env.SUPABASE_FETCH_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : null;

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        if (dispatcher) {
          return (await undiciFetch(input as Parameters<typeof undiciFetch>[0], {
            ...(init as Parameters<typeof undiciFetch>[1]),
            dispatcher
          })) as unknown as Response;
        }

        return await fetch(input, init);
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }) as typeof fetch;
}

export function createServerAuthSupabase() {
  const url = cleanEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = cleanEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error("Missing Supabase public server environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
  }

  return createClient(url, anonKey, {
    global: {
      fetch: createServerFetch()
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function createAdminSupabase() {
  const url = cleanEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = cleanEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase server environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  }

  return createClient(url, serviceKey, {
    global: {
      fetch: createServerFetch()
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function requireUser(authHeader: string | null) {
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user: data.user };
}

export async function requireAdmin(authHeader: string | null) {
  const ctx = await requireUser(authHeader);
  const { data, error } = await ctx.supabase
    .from("profiles")
    .select("role")
    .eq("user_id", ctx.user.id)
    .single();

  if (error || data?.role !== "admin") {
    throw new Error("Forbidden");
  }

  return ctx;
}
