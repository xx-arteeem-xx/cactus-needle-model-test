export const config = {
  port: Number(process.env.PORT || 3000),
  projectName: process.env.PROJECT_NAME || 'Needle Bench',
  projectVersion: process.env.PROJECT_VERSION || '0.0.0',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  llmUrl: process.env.LLM_INTERNAL_URL || 'http://llm:8000',
  llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS || 180000),
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS || 15),
};
