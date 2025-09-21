import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = process.env.NEXT_PUBLIC_SECRET;
const tokenName = process.env.NEXT_PUBLIC_TOKEN_NAME || "token";

export async function middleware(request) {
  const jwt = request.cookies.get(tokenName)?.value;

  if (!jwt) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(jwt, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*"
  ],
};
