
module.exports = {
  // Cache control headers
  headers: [
    {
      source: '/assets/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable' // 1 year for static assets
        }
      ]
    },
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate' // 1 hour for other routes
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload' // HSTS for better security
        }
      ]
    }
  ],
  // SSL configuration
  https: {
    cert: process.env.SSL_CERT_PATH || './ssl/cert.pem',
    key: process.env.SSL_KEY_PATH || './ssl/key.pem',
  },
  // Force redirect to HTTPS
  forceHttps: process.env.NODE_ENV === 'production'
};
