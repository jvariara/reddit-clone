import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
    const token = await getToken({req})

    // User is not logged in
    if(!token){
        return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
    }
}

export const config = {
    // All the paths where we want this to be ran
    matcher: ['/r/:path*/submit', '/r/create'],
}