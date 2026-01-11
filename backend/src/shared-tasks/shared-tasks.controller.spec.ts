import { Test, TestingModule } from '@nestjs/testing';
import { SharedTasksController } from './shared-tasks.controller';

describe('SharedTasksController', () => {
  let controller: SharedTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharedTasksController],
    }).compile();

    controller = module.get<SharedTasksController>(SharedTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
