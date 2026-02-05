export function errorResponse(message: string, status = 400, details?: unknown) {
  return Response.json(
    {
      error: message,
      ...(details ? { details } : {})
    },
    { status }
  );
}

export function okResponse<T>(data: T, init?: ResponseInit) {
  return Response.json(data, init);
}
