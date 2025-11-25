import { NextRequest, NextResponse } from 'next/server';

// helps debug what metadata we're extracting from substack
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Twitterbot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    const extractContent = (property: string, name?: string) => {
      const patterns = [
        new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+property=["']${property}["']`, 'i'),
      ];

      if (name) {
        patterns.push(
          new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i'),
          new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+name=["']${name}["']`, 'i')
        );
      }

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const metadata = {
      url,
      title: extractContent('og:title', 'twitter:title'),
      description: extractContent('og:description', 'twitter:description'),
      image: extractContent('og:image', 'twitter:image'),
      siteName: extractContent('og:site_name'),
      twitterCard: extractContent('twitter:card'),
    };

    return NextResponse.json({
      success: true,
      metadata,
      htmlLength: html.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch metadata',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
