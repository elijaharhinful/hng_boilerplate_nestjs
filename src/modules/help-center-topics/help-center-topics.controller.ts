import { Body, Controller, Post, Req, Request } from '@nestjs/common';
import { HelpCenterTopicsService } from './help-center-topics.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateHelpCenterTopicDTO } from './dto/create-help-center-topic.dto';
import { CreateHelpCenterTopicResponseDTO } from './dto/create-help-center-topic-reponse.dto';

@ApiBearerAuth()
@ApiTags('Help Center Topics')
@Controller('help-center')
export class HelpCenterTopicsController {
  constructor(private readonly helpCenterTopicsService: HelpCenterTopicsService) {}

  @ApiOperation({ summary: 'Create help center topics (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Help center topic created successfully', type: CreateHelpCenterTopicDTO })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('topics')
  async createHelpCenterTopics(
    @Body() createHelpCenterTopicDto: CreateHelpCenterTopicDTO,
    @Request() req
  ): Promise<CreateHelpCenterTopicResponseDTO> {
    return this.helpCenterTopicsService.createHelpCenterTopic(createHelpCenterTopicDto, req.user);
  }
}
