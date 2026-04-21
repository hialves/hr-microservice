import { Body, Controller, Post } from '@nestjs/common';
import { RequestService } from './request.service';
import type { CreateRequestInput } from './request.interface';

@Controller('timeoff')
export class RequestController {
  constructor(private service: RequestService) {}

  @Post()
  requestTimeOff(@Body() input: CreateRequestInput) {
    return this.service.create(input);
  }
}
