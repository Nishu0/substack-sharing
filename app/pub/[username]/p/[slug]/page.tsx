import { Metadata } from 'next';
import { headers } from 'next/headers';

type Props = {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// grab the original substack post and extract its metadata
async function fetchSubstackMetadata(username: string, slug: string) {
  const url = `https://open.substack.com/pub/${username}/p/${slug}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Twitterbot/1.0)',
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // extract opengraph tags - handle various HTML formats
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

    const title = extractContent('og:title', 'twitter:title');
    const description = extractContent('og:description', 'twitter:description');
    const image = extractContent('og:image', 'twitter:image');
    const siteName = extractContent('og:site_name');

    return {
      title: title || 'Substack Post',
      description: description || 'Read this post on Substack',
      image: image || null,
      siteName: siteName || 'Substack',
      url,
    };
  } catch (error) {
    console.error('Failed to fetch Substack metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params;
  const metadata = await fetchSubstackMetadata(username, slug);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://substack.lol';
  const currentUrl = `${baseUrl}/pub/${username}/p/${slug}`;

  if (!metadata) {
    return {
      title: 'Substack Post',
      description: 'Read this post on Substack',
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  // X requires specific metadata structure
  return {
    title: metadata.title,
    description: metadata.description,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: currentUrl,
      siteName: 'substack.lol',
      images: metadata.image
        ? [
            {
              url: metadata.image,
              width: 1200,
              height: 630,
              alt: metadata.title,
            },
          ]
        : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: metadata.image ? [metadata.image] : [],
      creator: '@substack',
    },
  };
}

// this page serves the metadata for crawlers, then redirects real users
// bots get more time to parse, real users redirect immediately
export default async function SubstackRedirect({ params, searchParams }: Props) {
  const { username, slug } = await params;
  const search = await searchParams;

  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  const metadata = await fetchSubstackMetadata(username, slug);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://substack.lol';
  const currentUrl = `${baseUrl}/pub/${username}/p/${slug}`;

  // rebuild the full substack url with any query params
  const substackUrl = `https://open.substack.com/pub/${username}/p/${slug}`;
  const queryString = new URLSearchParams(search as Record<string, string>).toString();
  const fullUrl = queryString ? `${substackUrl}?${queryString}` : substackUrl;

  // detect bots that need time to parse content
  const isBot = /bot|crawler|spider|crawling|telegram|whatsapp|facebook|twitter|slack/i.test(userAgent);
  const redirectDelay = isBot ? 5 : 0;

  // log for debugging
  console.log('User-Agent:', userAgent, 'isBot:', isBot, 'delay:', redirectDelay);

  return (
    <>
      <meta httpEquiv="refresh" content={`${redirectDelay};url=${fullUrl}`} />
      {!isBot && (
        <script dangerouslySetInnerHTML={{ __html: `setTimeout(function(){window.location.replace("${fullUrl}");}, 100);` }} />
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#666'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>Redirecting to Substack...</div>
          <a href={fullUrl} style={{ color: '#ff6719', textDecoration: 'none' }}>
            Click here if not redirected automatically
          </a>
        </div>
      </div>
    </>
  );
}
