import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }

  static badRequest(message) {
    return new ApiError(400, message)
  }

  static unauthorized(message) {
    return new ApiError(401, message)
  }

  static notFound(message) {
    return new ApiError(404, message)
  }

  static conflict(message) {
    return new ApiError(409, message)
  }

  static unprocessable(message) {
    return new ApiError(422, message)
  }
}

/**
 * Wraps a route handler so any thrown ApiError (or unexpected error) is
 * turned into the same { timestamp, status, error, message } shape the
 * Spring Boot GlobalExceptionHandler used to return.
 */
export function withErrorHandling(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          {
            timestamp: new Date().toISOString(),
            status: err.status,
            error: statusText(err.status),
            message: err.message,
          },
          { status: err.status }
        )
      }
      console.error('Unhandled API error:', err)
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 500,
          error: 'Internal Server Error',
          message: err?.message || 'An unexpected error occurred.',
        },
        { status: 500 }
      )
    }
  }
}

function statusText(status) {
  switch (status) {
    case 400:
      return 'Bad Request'
    case 401:
      return 'Unauthorized'
    case 404:
      return 'Not Found'
    case 409:
      return 'Conflict'
    case 422:
      return 'Unprocessable Entity'
    default:
      return 'Error'
  }
}
