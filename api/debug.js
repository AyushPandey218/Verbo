// Debug endpoint to verify serverless functions are working
module.exports = (req, res) => {
    const responseData = {
      status: 'API endpoints are working',
      serverTime: new Date().toISOString(),
      headers: req.headers,
      message: 'If you can see this message, the API routes are correctly configured'
    };
    
    // Set proper headers for CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    // Return JSON response
    res.status(200).json(responseData);
  };