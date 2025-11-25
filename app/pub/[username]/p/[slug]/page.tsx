import { Metadata } from 'next';

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

    // extract opengraph tags - handle both formats and HTML entities
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
// crawlers (like X) read the HTML/meta tags but don't execute JS
export default async function SubstackRedirect({ params, searchParams }: Props) {
  const { username, slug } = await params;
  const search = await searchParams;

  // rebuild the full substack url with any query params
  const substackUrl = `https://open.substack.com/pub/${username}/p/${slug}`;
  const queryString = new URLSearchParams(search as Record<string, string>).toString();
  const fullUrl = queryString ? `${substackUrl}?${queryString}` : substackUrl;

  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${fullUrl}`} />
      <script dangerouslySetInnerHTML={{ __html: `window.location.replace("${fullUrl}");` }} />
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
