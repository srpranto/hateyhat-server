import dotenv from "dotenv";

dotenv.config();

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  MONGODB_URI: getRequiredEnv("MONGODB_URI"),
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME?.trim() || "hateyhat",
  CLIENT_URL: getRequiredEnv("CLIENT_URL").replace(/\/$/, ""),
  AUTH_URL: getRequiredEnv("AUTH_URL").replace(/\/$/, ""),
};
