import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HcmModule } from './hcm/hcm.module';
import { TimeOffModule } from './timeoff/timeoff.module';
import { DispatchEventModule } from './common/event/dispatch-event.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DomainExceptionFilter } from './filters/domain-exception.filter';
import { AppListener } from './app.listener';
import { LatencyInterceptor } from './latency-interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DispatchEventModule,
    HcmModule,
    TimeOffModule,
  ],
  controllers: [],
  providers: [
    AppListener,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LatencyInterceptor },
  ],
})
export class AppModule {}
