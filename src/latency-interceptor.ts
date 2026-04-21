import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LatencyInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const startTime = new Date();
    return next
      .handle()
      .pipe(
        tap(() =>
          console.info(
            'latency: ',
            new Date().getTime() - startTime.getTime(),
            'ms',
          ),
        ),
      );
  }
}
