import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../env.js";
import type { AuthLocals } from "../types.js";

const JWKS = createRemoteJWKSet(new URL(`${env.AUTH_URL}/api/auth/jwks`));

export async function verifyToken(
  req: Request,
  res: Response<unknown, AuthLocals>,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Your session has expired or is invalid. Please log in again.",
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({
      message: "Your session has expired or is invalid. Please log in again.",
    });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.AUTH_URL,
      audience: env.AUTH_URL,
    });

    const email = typeof payload.email === "string" ? payload.email : "";
    if (!email) {
      res.status(401).json({
        message: "Your session has expired or is invalid. Please log in again.",
      });
      return;
    }

    const name = typeof payload.name === "string" ? payload.name : undefined;
    res.locals.userEmail = email;
    res.locals.userName = name;
    next();
  } catch {
    res.status(401).json({
      message: "Your session has expired or is invalid. Please log in again.",
    });
  }
}
