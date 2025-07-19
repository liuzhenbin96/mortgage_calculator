/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = {
  plugins: [
    'tailwindcss',
    'autoprefixer',
  ],
}; 