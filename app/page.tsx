'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';

export default function Home() {
  const [substackUrl, setSubstackUrl] = useState('');
  const [wrappedUrl, setWrappedUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateUrl = () => {
    setError('');
    setWrappedUrl('');
    setIsLoading(true);

    setTimeout(() => {
      if (!substackUrl.trim()) {
        setError('Please enter a Substack URL');
        setIsLoading(false);
        return;
      }

      try {
        const url = new URL(substackUrl);

        const pathParts = url.pathname.split('/').filter(Boolean);
        let username = '';
        let slug = '';

        if (url.hostname === 'open.substack.com') {
          const pubIndex = pathParts.indexOf('pub');
          const pIndex = pathParts.indexOf('p');

          if (pubIndex !== -1 && pIndex !== -1) {
            username = pathParts[pubIndex + 1];
            slug = pathParts[pIndex + 1];
          }
        } else if (url.hostname.endsWith('.substack.com')) {
          username = url.hostname.split('.')[0];
          const pIndex = pathParts.indexOf('p');

          if (pIndex !== -1) {
            slug = pathParts[pIndex + 1];
          }
        }

        if (!username || !slug) {
          setError('Invalid Substack URL format');
          setIsLoading(false);
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://substack.lol';
        const wrapped = `${baseUrl}/pub/${username}/p/${slug}`;

        setWrappedUrl(wrapped);
        setIsLoading(false);
      } catch (err) {
        setError('Invalid URL format');
        setIsLoading(false);
      }
    }, 300);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(wrappedUrl);
    toast.success('Copied to clipboard!', {
      duration: 2000,
      style: {
        background: '#18181b',
        color: '#fff',
        border: '1px solid #27272a',
      },
    });
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* animated background gradient orbs */}
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="max-w-2xl w-full space-y-8 relative z-10">
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              className="text-7xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              substack.lol
            </motion.h1>
            <motion.p
              className="text-zinc-400 text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              better previews for X/Twitter
            </motion.p>
            <motion.div
              className="flex items-center justify-center gap-2 text-sm text-zinc-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              wrap your substack links in seconds
            </motion.div>
          </motion.div>

          <motion.div
            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="space-y-3">
              <label htmlFor="substack-url" className="block text-sm font-medium text-zinc-300">
                paste your substack url
              </label>
              <motion.div whileFocus={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                <input
                  id="substack-url"
                  type="text"
                  value={substackUrl}
                  onChange={(e) => setSubstackUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generateUrl()}
                  placeholder="https://open.substack.com/pub/username/p/post-title"
                  className="w-full px-4 py-4 bg-zinc-950/80 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-white placeholder-zinc-600"
                />
              </motion.div>
            </div>

            {error && (
              <motion.div
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              onClick={generateUrl}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium py-4 px-6 rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  generating...
                </span>
              ) : (
                'generate url'
              )}
            </motion.button>

            {wrappedUrl && (
              <motion.div
                className="space-y-3 pt-4 border-t border-zinc-800"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.4 }}
              >
                <label className="block text-sm font-medium text-zinc-300">
                  your new url
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={wrappedUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-zinc-950/80 border border-zinc-700 rounded-xl text-zinc-300 cursor-pointer hover:border-zinc-600 transition-colors"
                    onClick={copyToClipboard}
                  />
                  <motion.button
                    onClick={copyToClipboard}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    copy
                  </motion.button>
                </div>
                <motion.p
                  className="text-sm text-zinc-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  share this url on X for better previews
                </motion.p>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-8 text-sm">
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <span className="text-zinc-400">proper metadata</span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-zinc-400">instant redirect</span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-zinc-400">no tracking</span>
                </motion.div>
              </div>
            </div>

            <div className="text-xs text-zinc-600 space-y-1">
              <p>fetches opengraph metadata from substack</p>
              <p>makes your posts look better when shared</p>
            </div>

            <motion.a
              href="https://x.com/intent/tweet?text=make%20your%20substack%20x%20preview%20for%20free%20at%20www.substack.lol%20from%20%40itsnishu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-300 hover:text-white transition-all shadow-lg mt-4"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </motion.a>
          </motion.div>

          <motion.footer
            className="text-center text-sm text-zinc-600 pt-8 border-t border-zinc-800/50 mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <p className="mb-2">Share your Substack preview on X</p>
            <p>
              Made by{' '}
              <a
                href="https://x.com/itsnishu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-400 transition-colors"
              >
                Nisarg Thakkar
              </a>
            </p>
          </motion.footer>
        </div>
      </div>
    </>
  );
}
