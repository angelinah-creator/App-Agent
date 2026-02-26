import { Test, TestingModule } from '@nestjs/testing';
import { NdaService } from './nda.service';

describe('NdaService', () => {
  let service: NdaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NdaService],
    }).compile();

    service = module.get<NdaService>(NdaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
