import { Test, TestingModule } from '@nestjs/testing';
import { PersonalTasksController } from './personal-tasks.controller';

describe('PersonalTasksController', () => {
  let controller: PersonalTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalTasksController],
    }).compile();

    controller = module.get<PersonalTasksController>(PersonalTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
