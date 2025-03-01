/**
 * Standard API response formatter
 */
export const apiResponse = {
  success: (data, message = 'Success') => ({
    status: 'success',
    message,
    data
  }),

  error: (error, message = 'Error occurred') => ({
    status: 'error',
    message,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  }),

  validationError: (errors) => ({
    status: 'fail',
    message: 'Validation failed',
    errors
  })
};