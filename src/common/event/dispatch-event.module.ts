import { Module } from '@nestjs/common';
import { DispatchEventService } from './dispatch-event.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' })],
  providers: [DispatchEventService],
  exports: [DispatchEventService],
})
export class DispatchEventModule {}
