interface ServerEvent {
  url: URL;
  req: { method: string; headers: Headers };
}

export default async function canonicalMiddleware(
  event: ServerEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const host =
    event.req.headers.get("x-forwarded-host") ||
    event.req.headers.get("host") ||
    event.url.hostname;

  // 1. Permanent redirect for any requests hitting www.pickmacapps.store
  if (host && host.includes("www.pickmacapps.store")) {
    const targetUrl = `https://pickmacapps.store${event.url.pathname}${event.url.search}`;
    return new Response(null, {
      status: 308,
      headers: {
        Location: targetUrl,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // 2. Handle CORS preflight OPTIONS requests for API and server function endpoints
  const isServerFnOrApi =
    event.url.pathname.startsWith("/_serverFn") ||
    event.url.pathname.startsWith("/api");

  if (isServerFnOrApi && event.req.method.toUpperCase() === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, *",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 3. Execute downstream handlers
  const result = await next();

  // 4. Inject CORS headers on API and serverFn responses
  if (isServerFnOrApi && result instanceof Response) {
    const headers = new Headers(result.headers);
    if (!headers.has("Access-Control-Allow-Origin")) {
      headers.set("Access-Control-Allow-Origin", "*");
    }
    if (!headers.has("Access-Control-Allow-Methods")) {
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    }
    return new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers,
    });
  }

  return result;
}
