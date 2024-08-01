import { Module } from '@nestjs/common';
import { HelpCenterTopicsService } from './help-center-topics.service';
import { HelpCenterTopicsController } from './help-center-topics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpCenterTopic } from './entities/help-center-topics.entity';
import { UserModule } from '../user/user.module';

@Module({
  providers: [HelpCenterTopicsService],
  controllers: [HelpCenterTopicsController],
  imports: [TypeOrmModule.forFeature([HelpCenterTopic]), UserModule],
  exports: [HelpCenterTopicsService],
})
export class HelpCenterTopicsModule {}
