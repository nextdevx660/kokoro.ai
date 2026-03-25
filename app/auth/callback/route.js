import { NextResponse } from 'next/server'

export async function GET(request) {
          return NextResponse.redirect('http://localhost:3000')
}