import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { BalanceService } from './balance.service';
import type { BalanceBatchSyncResponse } from '../../../contracts/rest/balance.response';
import type { Balance, CreateBalanceInput } from './balance.interface';

@Controller('hcm/balances')
export class BalanceController {
  constructor(private balanceService: BalanceService) {}

  @Post()
  create(@Body() input: CreateBalanceInput): Balance {
    return this.balanceService.create(input);
  }

  @Get('sync')
  getSync(
    @Query('since', new DefaultValuePipe(new Date(0).toISOString()))
    since: string,
    @Query('id', new DefaultValuePipe(0), ParseIntPipe) id: number,
  ): BalanceBatchSyncResponse {
    return this.balanceService.getSync(
      since.replace('T', ' ').replace('Z', ''),
      id,
      1000,
    );
  }
}
