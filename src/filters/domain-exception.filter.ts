import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { DomainError } from '../error/domain.error';
import { errorMapping } from '../error/error-mapping';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    if (host.getType() === 'http') {
      const ctx = host.switchToHttp();
      const statusCode = errorMapping.get(exception.constructor) || 500;

      ctx
        .getResponse()
        .status(statusCode)
        .json({
          ...exception,
          code: exception.code,
          statusCode,
          message: exception.message,
        });
      return;
    }

    console.warn('Unhandled domain exception:', exception);
  }
}
