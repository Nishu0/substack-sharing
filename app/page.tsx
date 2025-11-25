'use client';

import { useState } from 'react';

export default function Home() {
  const [substackUrl, setSubstackUrl] = useState('');
  const [wrappedUrl, setWrappedUrl] = useState('');
  const [error, setError] = useState('');

  const generateUrl = () => {
    setError('');
    setWrappedUrl('');

    if (!substackUrl.trim()) {
      setError('Please enter a Substack URL');
      return;
    }

    try {
      const url = new URL(substackUrl);

      // extract username and slug from substack url
      // format: https://open.substack.com/pub/{username}/p/{slug}
      // or: https://{username}.substack.com/p/{slug}

      const pathParts = url.pathname.split('/').filter(Boolean);
      let username = '';
      let slug = '';

      if (url.hostname === 'open.substack.com') {
        // format: /pub/{username}/p/{slug}
        const pubIndex = pathParts.indexOf('pub');
        const pIndex = pathParts.indexOf('p');

        if (pubIndex !== -1 && pIndex !== -1) {
          username = pathParts[pubIndex + 1];
          slug = pathParts[pIndex + 1];
        }
      } else if (url.hostname.endsWith('.substack.com')) {
        // format: {username}.substack.com/p/{slug}
        username = url.hostname.split('.')[0];
        const pIndex = pathParts.indexOf('p');

        if (pIndex !== -1) {
          slug = pathParts[pIndex + 1];
        }
      }

      if (!username || !slug) {
        setError('Invalid Substack URL format');
        return;
      }

      // build wrapped url
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://substack.lol';
      const wrapped = `${baseUrl}/pub/${username}/p/${slug}`;

      setWrappedUrl(wrapped);
    } catch (err) {
      setError('Invalid URL format');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(wrappedUrl);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold">substack.lol</h1>
          <p className="text-zinc-400 text-lg">
            better previews for X
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="substack-url" className="block text-sm font-medium text-zinc-300">
              paste your substack url
            </label>
            <input
              id="substack-url"
              type="text"
              value={substackUrl}
              onChange={(e) => setSubstackUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateUrl()}
              placeholder="https://open.substack.com/pub/username/p/post-title"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={generateUrl}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            generate url
          </button>

          {wrappedUrl && (
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              <label className="block text-sm font-medium text-zinc-300">
                your new url
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={wrappedUrl}
                  readOnly
                  className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-300"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
                >
                  copy
                </button>
              </div>
              <p className="text-sm text-zinc-500">
                share this url on X for better previews
              </p>
            </div>
          )}
        </div>

        <div className="text-center space-y-4">
          <div className="text-sm text-zinc-500">
            <p>this wrapper fetches proper opengraph metadata from substack</p>
            <p>and makes your posts look better when shared on X</p>
          </div>

          <div className="text-xs text-zinc-600">
            <p>no tracking • no analytics • just better previews</p>
          </div>
        </div>
      </div>
    </div>
  );
}
