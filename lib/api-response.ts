import { NextResponse } from "next/server";

export type ApiErrorResponse = {
  error: { code: string; message: string };
};

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status, headers: { "Cache-Control": "no-store" } });
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
