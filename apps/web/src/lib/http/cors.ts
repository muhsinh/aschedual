const EXTENSION_METHODS = "GET,POST,OPTIONS";
const EXTENSION_HEADERS = "Authorization,Content-Type";

function allowedExtensionOrigins() {
  return (process.env.EXTENSION_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getAllowedExtensionOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || !origin.startsWith("chrome-extension://")) {
    return null;
  }

  if (process.env.NODE_ENV !== "production") {
    return origin;
  }

  const allowlist = allowedExtensionOrigins();
  if (allowlist.includes(origin)) {
    return origin;
  }

  return null;
}

export function withExtensionCors(request: Request, response: Response) {
  const origin = getAllowedExtensionOrigin(request);
  if (!origin) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", EXTENSION_METHODS);
  response.headers.set("Access-Control-Allow-Headers", EXTENSION_HEADERS);
  response.headers.set("Vary", "Origin");
  return response;
}

export function extensionCorsPreflight(request: Request) {
  const origin = getAllowedExtensionOrigin(request);
  if (!origin) {
    if (
      process.env.NODE_ENV === "production" &&
      request.headers.get("origin")?.startsWith("chrome-extension://")
    ) {
      return new Response(null, { status: 403 });
    }

    return new Response(null, { status: 204 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": EXTENSION_METHODS,
      "Access-Control-Allow-Headers": EXTENSION_HEADERS,
      Vary: "Origin"
    }
  });
}
