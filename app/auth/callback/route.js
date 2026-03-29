export async function GET(request) {
          const url = new URL(request.url)
          const nextUrl = new URL('/', url.origin)
          nextUrl.search = url.search
          return Response.redirect(nextUrl)
}
