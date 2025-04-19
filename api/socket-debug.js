
// Debugging helper for Socket.IO issues on Vercel
module.exports = (req, res) => {
  const responseData = {
    status: 'Socket.IO debug endpoint is reachable',
    headers: req.headers,
    time: new Date().toISOString(),
    origin: req.headers.origin || 'unknown',
    host: req.headers.host || 'unknown',
    message: 'If you can see this message, API routes are working correctly on Vercel',
    connectionInfo: {
      protocol: req.headers['x-forwarded-proto'] || 'unknown',
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    }
  };
  
  // Set proper headers for CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // For preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Return JSON response
  res.status(200).json(responseData);
};
