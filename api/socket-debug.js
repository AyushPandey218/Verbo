
// Debugging helper for Socket.IO issues on Vercel
module.exports = (req, res) => {
    const responseData = {
      status: 'Socket.IO debug endpoint is reachable',
      headers: req.headers,
      time: new Date().toISOString(),
      message: 'If you can see this message, API routes are working correctly on Vercel'
    };
    
    res.status(200).json(responseData);
  };
  