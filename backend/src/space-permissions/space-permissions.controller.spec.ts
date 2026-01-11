import { Test, TestingModule } from '@nestjs/testing';
import { SpacePermissionsController } from './space-permissions.controller';

describe('SpacePermissionsController', () => {
  let controller: SpacePermissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpacePermissionsController],
    }).compile();

    controller = module.get<SpacePermissionsController>(SpacePermissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
