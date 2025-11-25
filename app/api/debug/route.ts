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
      // match meta tags with various attribute orders and spacing
      const patterns = [
        // property="..." content="..."
        new RegExp(`<meta[^>]*?property=["']${property.replace(/:/g, '\\:')}["'][^>]*?content=["']([^"']*?)["']`, 'is'),
        // content="..." property="..."
        new RegExp(`<meta[^>]*?content=["']([^"']*?)["'][^>]*?property=["']${property.replace(/:/g, '\\:')}["']`, 'is'),
      ];

      if (name) {
        patterns.push(
          // name="..." content="..."
          new RegExp(`<meta[^>]*?name=["']${name}["'][^>]*?content=["']([^"']*?)["']`, 'is'),
          // content="..." name="..."
          new RegExp(`<meta[^>]*?content=["']([^"']*?)["'][^>]*?name=["']${name}["']`, 'is')
        );
      }

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
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

    // grab a sample of meta tags for debugging
    const metaSample = html.match(/<meta[^>]*>/gi)?.slice(0, 20) || [];

    return NextResponse.json({
      success: true,
      metadata,
      htmlLength: html.length,
      debug: {
        sampleMetaTags: metaSample,
      },
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
