import { Test, TestingModule } from '@nestjs/testing';
import { HelpCenterTopicsService } from '../help-center-topics.service';

describe('HelpCenterTopicsService', () => {
  let service: HelpCenterTopicsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelpCenterTopicsService],
    }).compile();

    service = module.get<HelpCenterTopicsService>(HelpCenterTopicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
