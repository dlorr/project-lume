import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Shape of every error response returned by the API.
 * Having a consistent error schema is critical for frontend developers
 * and API consumers — they can always expect the same structure.
 */
export interface ErrorResponse {
  statusCode: number;
  message: string | string[]; // string[] when ValidationPipe returns multiple errors
  error: string; // Short human-readable error type, e.g. "Not Found"
  path: string; // The request URL that caused the error
  timestamp: string; // ISO 8601 timestamp for log correlation
}

/**
 * GlobalExceptionFilter catches ALL exceptions thrown anywhere in the app.
 *
 * @Catch() with no arguments means: catch everything — HttpExceptions,
 * Prisma errors, runtime errors, third-party library errors, etc.
 *
 * Without this, NestJS would return inconsistent error shapes depending on
 * where the error was thrown, and raw stack traces could leak to the client.
 *
 * Flow:
 *   1. Exception is thrown anywhere in the app
 *   2. NestJS routes it to this filter
 *   3. We normalize it into a consistent ErrorResponse shape
 *   4. We log it appropriately
 *   5. We send a clean JSON response to the client
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // Switch to HTTP context to access request/response objects
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Default values for unknown/unhandled errors
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      // NestJS HttpException — includes 400, 401, 403, 404, 422, etc.
      // Also includes ValidationPipe errors which throw HttpException with an array of messages.
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        // Simple string exception: throw new HttpException('Not found', 404)
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        // Object exception (e.g. from ValidationPipe): { message: [...], error: 'Bad Request' }
        const res = exceptionResponse as Record<string, any>;
        message = res.message || message;
        error = res.error || error;
      }
    } else if (exception instanceof Error) {
      // Unexpected runtime error (Prisma errors, JS errors, etc.)
      // Log the full stack trace for debugging, but don't expose it to the client
      message = exception.message;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    const errorBody: ErrorResponse = {
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // Log at warn level for expected errors (4xx), error level already logged above for 5xx
    if (statusCode < 500) {
      this.logger.warn(`${request.method} ${request.url} → ${statusCode}`);
    }

    response.status(statusCode).json(errorBody);
  }
}
