import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'i18n system configured',
    availableLanguages: ['en', 'th', 'zh', 'es', 'de', 'fr', 'ja'],
    timestamp: new Date().toISOString(),
  });
}