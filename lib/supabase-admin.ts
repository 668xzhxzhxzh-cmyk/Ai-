import { createClient } from "@supabase/supabase-js";

function cleanEnv(name: string) {
  return process.env[name]?.trim();
}

function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = cleanEnv(name);
    if (value) return value;
  }
  return undefined;
}

function getFetchTimeoutMs() {
  const value = Number(cleanEnv("SUPABASE_FETCH_TIMEOUT_MS") ?? 8000);
  return Number.isFinite(value) && value > 0 ? value : 8000;
}

export function createServerFetch() {
  const proxyUrl = process.env.SUPABASE_FETCH_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), getFetchTimeoutMs());

      try {
        const requestInit = {
          ...init,
          signal: init?.signal ?? controller.signal
        };

        if (proxyUrl) {
          const { ProxyAgent, fetch: undiciFetch } = await import("undici");
          const dispatcher = new ProxyAgent(proxyUrl);
          return (await undiciFetch(input as Parameters<typeof undiciFetch>[0], {
            ...(requestInit as Parameters<typeof undiciFetch>[1]),
            dispatcher
          })) as unknown as Response;
        }

        return await fetch(input, requestInit);
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError;
  }) as typeof fetch;
}

export function createServerAuthSupabase() {
  const url = firstEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = firstEnv("SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error("Missing Supabase auth environment variables. Check SUPABASE_URL and SUPABASE_ANON_KEY in your deployment platform.");
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
  const url = firstEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = cleanEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase server environment variables. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your deployment platform.");
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
