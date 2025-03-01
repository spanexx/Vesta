const createErrorResponse = (res, status, errorCode, message, error) => {
  res.status(status).json({
    error: {
      code: errorCode,
      message,
      timestamp: new Date().toISOString(),
      documentation: "https://api.vesta.com/docs/errors/" + errorCode
    }
  });
  if (error) {
    console.info('Error:', error);
  }
};

export default createErrorResponse;