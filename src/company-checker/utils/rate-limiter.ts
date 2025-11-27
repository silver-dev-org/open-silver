import { NextApiRequest, NextApiResponse } from "next";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 60 * 1000; // 1 minute

export const rateLimit = (req: NextApiRequest, res: NextApiResponse) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor || req.socket.remoteAddress;
  const now = Date.now();

  if (!ip) {
    return { success: true };
  }

  if (!store[ip]) {
    store[ip] = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
  } else {
    if (now > store[ip].resetTime) {
      store[ip] = {
        count: 1,
        resetTime: now + WINDOW_MS,
      };
    } else {
      store[ip].count++;
    }
  }

  if (store[ip].count > 1) {
    const retryAfter = Math.ceil((store[ip].resetTime - now) / 1000);
    res.setHeader("Retry-After", retryAfter);
    return {
      success: false,
      message: `Demasiadas solicitudes. Por favor, inténtelo de nuevo en ${retryAfter} segundos.`,
      retryAfter,
    };
  }

  return { success: true };
};
