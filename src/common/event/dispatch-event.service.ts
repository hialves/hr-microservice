import { Injectable } from '@nestjs/common';
import {
  EventEmitter2,
  EventEmitterReadinessWatcher,
} from '@nestjs/event-emitter';
import { Event } from '../../contracts/events/event.interface';

@Injectable()
export class DispatchEventService {
  constructor(
    private eventEmitter: EventEmitter2,
    private eventEmitterReadinessWatcher: EventEmitterReadinessWatcher,
  ) {}

  async dispatch(...events: Event[]): Promise<void> {
    await this.eventEmitterReadinessWatcher.waitUntilReady();
    events.forEach((event) => this.eventEmitter.emit(event.eventName, event));
  }

  async dispatchUnsafe(...events: Event[]): Promise<void> {
    events.forEach((event) => this.eventEmitter.emit(event.eventName, event));
  }
}
