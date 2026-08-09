import { LLMS_TEXT } from '@/lib/seo/llms'

export const dynamic = 'force-static'

export function GET(): Response {
  return new Response(LLMS_TEXT, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

