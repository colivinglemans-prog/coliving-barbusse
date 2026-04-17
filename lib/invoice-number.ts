import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;
function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return redisClient;
}

export async function getNextInvoiceNumber(date = new Date()): Promise<string> {
  const year = date.getUTCFullYear();
  const key = `invoice:counter:${year}`;
  const n = await getRedis().incr(key);
  return `${year}-${String(n).padStart(3, "0")}`;
}
