import { createClient } from 'redis';
import { config } from './config.js';

export const redis = createClient({ url: config.redisUrl });
export const redisReady = redis.connect();

export async function cached(key, producer) {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit);
  } catch {
    // cache errors must never break the request path
  }
  const value = await producer();
  try {
    await redis.set(key, JSON.stringify(value), { EX: config.cacheTtlSeconds });
  } catch {
    // ignore
  }
  return value;
}

export async function bust() {
  try {
    const keys = await redis.keys('needle-bench:*');
    if (keys.length) await redis.del(keys);
  } catch {
    // ignore
  }
}

export async function ping() {
  return redis.ping();
}
