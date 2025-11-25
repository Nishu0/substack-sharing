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
        'User-Agent': 'Mozilla/5.0 (compatible; SubstackBot/1.0)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // extract opengraph tags from the html using regex
    // we check both og: and twitter: variants since substack uses both
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/) ||
                       html.match(/<meta name="twitter:title" content="([^"]*)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/) ||
                      html.match(/<meta name="twitter:description" content="([^"]*)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/) ||
                       html.match(/<meta name="twitter:image" content="([^"]*)"/);

    return {
      title: titleMatch ? titleMatch[1] : 'Substack Post',
      description: descMatch ? descMatch[1] : 'Read this post on Substack',
      image: imageMatch ? imageMatch[1] : null,
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

  if (!metadata) {
    return {
      title: 'Substack Post',
      description: 'Read this post on Substack',
    };
  }

  return {
    title: metadata.title,
    description: metadata.description,
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      images: metadata.image ? [{ url: metadata.image }] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: metadata.image ? [metadata.image] : [],
    },
  };
}

// this page renders with proper og tags for twitter's crawler
// then redirects users to the actual substack post
// using meta refresh + js redirect lets bots see metadata before redirect
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
      <script dangerouslySetInnerHTML={{ __html: `window.location.href="${fullUrl}"` }} />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
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
