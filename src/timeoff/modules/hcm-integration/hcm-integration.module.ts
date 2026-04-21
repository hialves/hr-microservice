import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HcmIntegrationService } from './hcm-integration.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 5000, baseURL: 'http://localhost:3000' }),
  ],
  providers: [HcmIntegrationService],
  exports: [HcmIntegrationService],
})
export class HcmIntegrationModule {}
