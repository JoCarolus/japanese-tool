// app/api/test-key/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  const keyLength = process.env.ANTHROPIC_API_KEY?.length || 0;
  
  return NextResponse.json({
    hasKey,
    keyLength,
    keyPreview: hasKey ? process.env.ANTHROPIC_API_KEY?.substring(0, 15) + '...' : 'none',
    // Don't log the full key for security
  });
}