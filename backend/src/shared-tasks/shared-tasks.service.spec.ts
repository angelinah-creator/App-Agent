import { Test, TestingModule } from '@nestjs/testing';
import { SharedTasksService } from './shared-tasks.service';

describe('SharedTasksService', () => {
  let service: SharedTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedTasksService],
    }).compile();

    service = module.get<SharedTasksService>(SharedTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
