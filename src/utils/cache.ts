import { Redis } from 'ioredis';
/* eslint-disable import/no-anonymous-default-export */

/*
TLDR; " Expires " is seconds based. for example 60*60 would = 3600 (an hour)
*/

const fetch = async <T>(redis: Redis, key: string, fetcher: () => T, expires: number) => {
  const existing = await get<T>(redis, key);
  if (existing !== null) return existing;

  return set(redis, key, fetcher, expires);
};

const get = async <T>(redis: Redis, key: string): Promise<T> => {
  console.log('GET: ' + key);
  const value = await redis.get(key);
  if (value === null) return null as any;

  return JSON.parse(value);
};

const set = async <T>(redis: Redis, key: string, fetcher: () => T, expires: number) => {
  const value = await fetcher();
  const bufferSize = Buffer.byteLength(JSON.stringify(value), 'utf8') + 1000 // Rough estimate of whole request;
  if (bufferSize < 1048576) {
    await redis.set(key, JSON.stringify(value), 'EX', expires);
    console.log(`SET: ${key}, EXP: ${expires}`);
  } else
    console.log(`SET: ${key} is too large to cache!`);
  return value;
};

const del = async (redis: Redis, key: string) => {
  await redis.del(key);
};

export default { fetch, set, get, del };
