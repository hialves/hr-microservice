import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import Database from 'better-sqlite3';
import { TimeOffModule } from '../src/timeoff/timeoff.module';
import { HcmModule } from '../src/hcm/hcm.module';
import {
  HCM_DB_TOKEN,
  TIMEOFF_DB_TOKEN,
} from '../src/common/constants/database.constants';
import { BalanceBatchSyncResponse } from '../src/contracts/rest/balance.response';
import { Request } from '../src/timeoff/modules/request/request.interface';
import { BalanceSnapshot } from '../src/timeoff/modules/balance-snapshot/balance-snapshot.interface';
import { Ledger } from '../src/hcm/modules/ledger/ledger.interface';
import { Balance } from '../src/hcm/modules/balance/balance.interface';

describe('Balance (e2e)', () => {
  let module: TestingModule;
  let app: INestApplication<App>;
  let httpServer: App;
  let hcmDb: Database.Database;
  let timeoffDb: Database.Database;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [HcmModule, TimeOffModule],
    })
      .overrideProvider(HCM_DB_TOKEN)
      .useValue(new Database(':memory:'))
      .overrideProvider(TIMEOFF_DB_TOKEN)
      .useValue(new Database(':memory:'))
      .compile();

    app = module.createNestApplication();
    httpServer = app.getHttpServer();
    hcmDb = app.get(HCM_DB_TOKEN);
    timeoffDb = app.get(TIMEOFF_DB_TOKEN);

    await app.init();
  });

  describe('Balance', () => {
    it('should return 201', () => {
      return request(httpServer)
        .post('/hcm/balances')
        .send({
          days: 100,
          employeeId: 1,
          locationId: 1,
          idempotencyKey: 'INITIAL',
          reason: null,
        })
        .expect(201);
    });

    it('should match the data stored', async () => {
      await request(httpServer).post('/hcm/balances').send({
        days: 100,
        employeeId: 1,
        locationId: 1,
        idempotencyKey: 'INITIAL',
        reason: null,
      });

      const response = await request(httpServer)
        .get('/hcm/balances/sync')
        .expect(200);
      const body = response.body as BalanceBatchSyncResponse;

      expect(body.data).toHaveLength(1);
    });

    it('should create timeoff concurrently, blocking one of them when balance is not enough', async () => {
      await request(httpServer).post('/hcm/balances').send({
        days: 100,
        employeeId: 1,
        locationId: 1,
        idempotencyKey: 'INITIAL',
        reason: null,
      });

      await Promise.all([
        request(httpServer)
          .post('/timeoff')
          .send({ employeeId: 1, locationId: 1, days: 30 }),
        request(httpServer)
          .post('/timeoff')
          .send({ employeeId: 1, locationId: 1, days: 80 }),
      ]);

      const requests = timeoffDb
        .prepare(`SELECT * FROM requests`)
        .all() as Request[];
      const balanceSnapshot = timeoffDb
        .prepare(`SELECT * FROM balance_snapshots`)
        .get() as BalanceSnapshot;
      const balance = hcmDb.prepare(`SELECT * FROM balances`).get() as Balance;
      const ledger = hcmDb.prepare(`SELECT * FROM ledger`).all() as Ledger[];
      const processedRequests = hcmDb
        .prepare(`SELECT * FROM processed_requests`)
        .all();

      expect(requests).toHaveLength(2);
      expect(requests.some((r) => r.status === 'APPROVED')).toBe(true);
      expect(requests.some((r) => r.status === 'REJECTED')).toBe(true);

      expect([70, 20].includes(balanceSnapshot.amount));
      expect([70, 20].includes(balance.amount));
      expect(balanceSnapshot.amount).toBe(balance.amount);
      expect(balance.version).toBe(2);
      expect(balanceSnapshot.version).toBe(2);

      expect(ledger).toHaveLength(2);
      expect(processedRequests).toHaveLength(2);
    });
  });
});
