import { BadRequestException, ForbiddenException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HelpCenterTopic } from './entities/help-center-topics.entity';
import { Repository } from 'typeorm';
import { CreateHelpCenterTopicDTO } from './dto/create-help-center-topic.dto';
import { User, UserType } from '../user/entities/user.entity';
import { CreateHelpCenterTopicResponseDTO } from './dto/create-help-center-topic-reponse.dto';

@Injectable()
export class HelpCenterTopicsService {
  constructor(
    @InjectRepository(HelpCenterTopic)
    private helpCenterTopicRepository: Repository<HelpCenterTopic>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async createHelpCenterTopic(
    createHelpCenterTopicDto: CreateHelpCenterTopicDTO,
    userId: string
  ): Promise<CreateHelpCenterTopicResponseDTO> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ForbiddenException({
        error: 'Forbidden',
        message: 'User not found',
        status_code: HttpStatus.FORBIDDEN,
      });
    }
    if (user.user_type !== UserType.SUPER_ADMIN) {
      throw new ForbiddenException({
        error: 'Forbidden',
        message: 'Only Super Admins can create help center topics',
        status_code: HttpStatus.FORBIDDEN,
      });
    }

    try {
      const newTopic = this.helpCenterTopicRepository.create({
        ...createHelpCenterTopicDto,
        user: user,
        author: `${user.first_name} ${user.last_name}`,
      });

      const savedTopic = await this.helpCenterTopicRepository.save(newTopic);

      return {
        status_code: HttpStatus.CREATED,
        status: 'success',
        message: 'Topic created successfully',
        data: {
          id: savedTopic.id,
          title: savedTopic.title,
          content: savedTopic.content,
          author: savedTopic.author,
          is_deleted: savedTopic.is_deleted,
          created_at: savedTopic.created_at,
          updated_at: savedTopic.updated_at,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        error: 'Bad Request',
        message: 'Failed to create help center topic',
        status_code: HttpStatus.BAD_REQUEST,
      });
    }
  }
}
