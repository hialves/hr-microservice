import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { Event } from './contracts/events/event.interface';
import { appendFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

@Injectable()
export class AppListener {
  @OnEvent('**')
  handleAll(payload: Event) {
    const now = new Date();
    const content = JSON.stringify({
      occurredAt: now.getTime(),
      payload,
    });

    const filepath = this.getFilePath(now);
    if (!existsSync(filepath)) writeFile(filepath, '');
    appendFile(filepath, content.concat('\n'));
  }

  private getFilePath(date: Date) {
    const dateString = date.toISOString().slice(0, 10);
    return path.join(process.cwd(), `event-logs-${dateString}.txt`);
  }
}
