#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const projectName = process.env.EDGEONE_PROJECT_NAME || "ai-shaofeng-fitness";
const environment = process.env.EDGEONE_ENV || "production";
const area = process.env.EDGEONE_AREA || "global";
const envFile = process.env.EDGEONE_ENV_FILE || ".env.local";
const expectedSupabaseUrl =
  process.env.EXPECTED_SUPABASE_URL || "https://rufkeckqicyqzmfaeual.supabase.co";
const dryRun = process.argv.includes("--dry-run");
const skipEnv = process.argv.includes("--skip-env");
const token = process.env.EDGEONE_PAGES_API_TOKEN || process.env.EDGEONE_TOKEN;

function parseEnvFile(path) {
  if (!existsSync(path)) return {};

  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return env;

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) return env;

      const key = trimmed.slice(0, equalsIndex).trim();
      let value = trimmed.slice(equalsIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
      return env;
    }, {});
}

const fileEnv = parseEnvFile(envFile);

function readEnv(name) {
  return process.env[name] || fileEnv[name] || "";
}

const supabaseUrl = readEnv("SUPABASE_URL") || readEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = readEnv("SUPABASE_ANON_KEY") || readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

const edgeoneEnv = {
  SUPABASE_URL: supabaseUrl,
  SUPABASE_ANON_KEY: supabaseAnonKey,
  SUPABASE_SERVICE_ROLE_KEY: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  DEEPSEEK_API_KEY: readEnv("DEEPSEEK_API_KEY"),
  DEEPSEEK_BASE_URL: readEnv("DEEPSEEK_BASE_URL") || "https://api.deepseek.com",
  DEEPSEEK_MODEL: readEnv("DEEPSEEK_MODEL") || "deepseek-chat",
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey
};

const nextPublicSiteUrl = readEnv("NEXT_PUBLIC_SITE_URL");
if (nextPublicSiteUrl) {
  edgeoneEnv.NEXT_PUBLIC_SITE_URL = nextPublicSiteUrl;
}

function assertConfig() {
  const missing = Object.entries(edgeoneEnv)
    .filter(([key, value]) => key !== "NEXT_PUBLIC_SITE_URL" && !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (!supabaseUrl.startsWith("https://") || !supabaseUrl.endsWith(".supabase.co")) {
    throw new Error("SUPABASE_URL must be a Supabase Project URL like https://xxxx.supabase.co.");
  }

  if (
    supabaseUrl !== expectedSupabaseUrl &&
    process.env.EDGEONE_ALLOW_SUPABASE_URL_MISMATCH !== "1"
  ) {
    throw new Error(
      `SUPABASE_URL is ${supabaseUrl}, expected ${expectedSupabaseUrl}. ` +
        "Set EDGEONE_ALLOW_SUPABASE_URL_MISMATCH=1 only if the Supabase project really changed."
    );
  }

  for (const [key, value] of Object.entries(edgeoneEnv)) {
    if (value === key || value === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
      throw new Error(`${key} looks like a variable name, not a real value.`);
    }
  }
}

const redactions = [
  token,
  ...Object.values(edgeoneEnv).filter((value) => value && value.length > 12)
];

function redact(text) {
  let result = text;
  for (const value of redactions) {
    if (!value) continue;
    result = result.split(value).join("[redacted]");
  }
  return result;
}

function run(command, args, options = {}) {
  const printableArgs = args.map((arg) => (options.secretArgs?.has(arg) ? "[redacted]" : arg));
  console.log(`$ ${command} ${printableArgs.join(" ")}`);

  if (dryRun) return;

  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: false,
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.stdout) process.stdout.write(redact(result.stdout));
  if (result.stderr) process.stderr.write(redact(result.stderr));

  if (result.status !== 0) {
    throw new Error(`Command failed with exit code ${result.status}: ${command}`);
  }
}

function npx(args, options) {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  run(command, args, options);
}

assertConfig();

if (!token) {
  console.warn(
    "EDGEONE_PAGES_API_TOKEN is not set. The script will use the current EdgeOne CLI login if available."
  );
}

const tokenArgs = token ? ["-t", token] : [];
const secretArgs = new Set([token, ...Object.values(edgeoneEnv)].filter(Boolean));

console.log(`Preparing EdgeOne deployment for ${projectName} (${environment}, ${area}).`);
console.log(`Syncing ${Object.keys(edgeoneEnv).length} environment variables from ${envFile}.`);

if (!skipEnv) {
  npx(["edgeone", "makers", "link", "-n", projectName, ...tokenArgs], { secretArgs });

  for (const [key, value] of Object.entries(edgeoneEnv)) {
    console.log(`Setting ${key}`);
    npx(["edgeone", "makers", "env", "set", key, value, ...tokenArgs], { secretArgs });
  }
} else {
  console.log("Skipping EdgeOne environment sync because --skip-env was provided.");
}

run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
npx(
  [
    "edgeone",
    "makers",
    "deploy",
    "-n",
    projectName,
    "-e",
    environment,
    "-a",
    area,
    ...tokenArgs,
    "--json"
  ],
  { secretArgs }
);

