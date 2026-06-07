export function getDataEnvironment() {
  const configuredEnv = process.env.DATA_ENV?.trim();

  if (configuredEnv) return configuredEnv;

  return process.env.NODE_ENV === "development" ? "dev" : "prod";
}
