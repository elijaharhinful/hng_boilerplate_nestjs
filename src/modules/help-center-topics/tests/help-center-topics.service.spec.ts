import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HelpCenterTopicsService } from '../help-center-topics.service';
import { HelpCenterTopic } from '../entities/help-center-topics.entity';
import { User, UserType } from '../../user/entities/user.entity';
import { CreateHelpCenterTopicDTO } from '../dto/create-help-center-topic.dto';
import { CreateHelpCenterTopicResponseDTO } from '../dto/create-help-center-topic-reponse.dto';
import { BadRequestException, ForbiddenException, HttpStatus } from '@nestjs/common';

describe('HelpCenterTopicsService', () => {
  let service: HelpCenterTopicsService;
  let helpCenterTopicRepository: Repository<HelpCenterTopic>;
  let userRepository: Repository<User>;

  const mockHelpCenterTopicRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createHelpCenterTopic', () => {
    const userId = 'valid-user-id';
    const createHelpCenterTopicDto: CreateHelpCenterTopicDTO = {
      title: 'Sample Topic',
      content: 'This is a sample help center topic content',
    };

    const user: User = {
      id: 'some-uuid',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedpassword',
      user_type: UserType.SUPER_ADMIN,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      phone: '1234567890',
      backup_codes: [],
      attempts_left: 3,
      time_left: 60,
      is_2fa_enabled: true,
      secret: 'somesecret',
      owned_organisations: [],
      created_organisations: [],
      invites: [],
      jobs: [],
      testimonials: [],
      organisationMembers: [],
    };

    const savedTopic: HelpCenterTopic = {
      id: 'topic-id',
      title: createHelpCenterTopicDto.title,
      content: createHelpCenterTopicDto.content,
      author: `${user.first_name} ${user.last_name}`,
      user: user,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should create a new help center topic', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(user);
      mockHelpCenterTopicRepository.create.mockReturnValue(savedTopic);
      mockHelpCenterTopicRepository.save.mockResolvedValueOnce(savedTopic);

      const result: CreateHelpCenterTopicResponseDTO = await service.createHelpCenterTopic(
        createHelpCenterTopicDto,
        userId
      );

      expect(result).toEqual({
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
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockHelpCenterTopicRepository.create).toHaveBeenCalledWith({
        ...createHelpCenterTopicDto,
        user: user,
        author: `${user.first_name} ${user.last_name}`,
      });
      expect(mockHelpCenterTopicRepository.save).toHaveBeenCalledWith(savedTopic);
    });

    it('should throw ForbiddenException if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.createHelpCenterTopic(createHelpCenterTopicDto, userId)).rejects.toThrow(ForbiddenException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockHelpCenterTopicRepository.create).not.toHaveBeenCalled();
      expect(mockHelpCenterTopicRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not a super admin', async () => {
      const nonSuperAdminUser: User = { ...user, user_type: UserType.USER };
      mockUserRepository.findOne.mockResolvedValueOnce(nonSuperAdminUser);

      await expect(service.createHelpCenterTopic(createHelpCenterTopicDto, userId)).rejects.toThrow(ForbiddenException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockHelpCenterTopicRepository.create).not.toHaveBeenCalled();
      expect(mockHelpCenterTopicRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException on save error', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(user);
      mockHelpCenterTopicRepository.create.mockReturnValue(savedTopic);
      mockHelpCenterTopicRepository.save.mockRejectedValueOnce(new Error('Save error'));

      await expect(service.createHelpCenterTopic(createHelpCenterTopicDto, userId)).rejects.toThrow(
        BadRequestException
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockHelpCenterTopicRepository.create).toHaveBeenCalledWith({
        ...createHelpCenterTopicDto,
        user: user,
        author: `${user.first_name} ${user.last_name}`,
      });
      expect(mockHelpCenterTopicRepository.save).toHaveBeenCalledWith(savedTopic);
    });
  });
});
