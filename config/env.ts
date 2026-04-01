function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const env = {
  MONGODB_URI: optional("MONGODB_URI", "mongodb://localhost:27017/euspl"),
  JWT_SECRET: required("JWT_SECRET"),
  NODE_ENV: optional("NODE_ENV", "development"),
  isDev: process.env.NODE_ENV !== "production",
  isProd: process.env.NODE_ENV === "production",
} as const;
