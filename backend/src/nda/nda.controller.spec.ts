import { Test, TestingModule } from '@nestjs/testing';
import { NdaController } from './nda.controller';

describe('NdaController', () => {
  let controller: NdaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NdaController],
    }).compile();

    controller = module.get<NdaController>(NdaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
