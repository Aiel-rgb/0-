const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.warn(`[ENV] Variable ${key} is missing!`);
    return "";
  }
  return value;
};

export const ENV = {
  get appId() { return getEnv("VITE_APP_ID"); },
  get cookieSecret() { return getEnv("JWT_SECRET"); },
  get databaseUrl() { return getEnv("DATABASE_URL"); },
  get oAuthServerUrl() { return getEnv("OAUTH_SERVER_URL"); },
  get ownerOpenId() { return getEnv("OWNER_OPEN_ID"); },
  get isProduction() { return process.env.NODE_ENV === "production"; },
  get forgeApiUrl() { return getEnv("BUILT_IN_FORGE_API_URL"); },
  get forgeApiKey() { return getEnv("BUILT_IN_FORGE_API_KEY"); },
};
