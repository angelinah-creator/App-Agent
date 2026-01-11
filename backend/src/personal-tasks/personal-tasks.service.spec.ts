import { Test, TestingModule } from '@nestjs/testing';
import { PersonalTasksService } from './personal-tasks.service';

describe('PersonalTasksService', () => {
  let service: PersonalTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonalTasksService],
    }).compile();

    service = module.get<PersonalTasksService>(PersonalTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
