/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the dev server to be reached via 127.0.0.1 as well as localhost --
  // without this, Next.js blocks its own JS bundles as "cross-origin" when
  // accessed via 127.0.0.1, silently breaking the page (it looks fine, but
  // no button does anything because React never hydrates).
  allowedDevOrigins: ["127.0.0.1"],
};

module.exports = nextConfig;
