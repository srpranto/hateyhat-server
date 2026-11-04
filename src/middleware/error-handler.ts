import type { Request, Response, NextFunction } from "express";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorStack = err instanceof Error ? err.stack : undefined;

  console.error(`[${timestamp}] ERROR: ${req.method} ${req.originalUrl} - ${errorMessage}`);
  if (errorStack && process.env.NODE_ENV !== "production") {
    console.error(errorStack);
  }

  res.status(500).json({
    message: "Internal server error.",
  });
}
