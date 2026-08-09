import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../artifacts/api-server/src/app";

/**
 * Vercel can invoke a catch-all function with either the original `/api/*`
 * pathname or a pathname relative to the function. The Express app mounts
 * its routes at `/api`, so normalize the latter form before forwarding it.
 */
export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
): void {
  const url = req.url ?? "/";
  const [pathname, query = ""] = url.split("?", 2);

  if (pathname !== "/api" && !pathname.startsWith("/api/")) {
    const apiPath = pathname === "/" ? "" : pathname;
    req.url = `/api${apiPath}${query ? `?${query}` : ""}`;
  }

  const expressHandler = app as unknown as (
    request: IncomingMessage,
    response: ServerResponse,
  ) => void;

  expressHandler(req, res);
}