import { Test, TestingModule } from '@nestjs/testing';
import { KPIsService } from './kpis.service';

describe('KpisService', () => {
  let service: KPIsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KPIsService],
    }).compile();

    service = module.get<KPIsService>(KPIsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
