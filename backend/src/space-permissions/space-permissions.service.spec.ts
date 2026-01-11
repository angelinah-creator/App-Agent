import { Test, TestingModule } from '@nestjs/testing';
import { SpacePermissionsService } from './space-permissions.service';

describe('SpacePermissionsService', () => {
  let service: SpacePermissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpacePermissionsService],
    }).compile();

    service = module.get<SpacePermissionsService>(SpacePermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
