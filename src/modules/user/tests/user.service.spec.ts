import { BadRequestException, ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../../profile/entities/profile.entity';
import { DeactivateAccountDto } from '../dto/deactivate-account.dto';
import { UpdateUserDto } from '../dto/update-user-dto';
import UserResponseDTO from '../dto/user-response.dto';
import { User, UserType } from '../entities/user.entity';
import { UserPayload } from '../interfaces/user-payload.interface';
import CreateNewUserOptions from '../options/CreateNewUserOptions';
import UserIdentifierOptionsType from '../options/UserIdentifierOptions';
import UserService from '../user.service';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;
  let profileRepository: Repository<Profile>;

  const mockUserRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    profileRepository = module.get<Repository<Profile>>(getRepositoryToken(Profile));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateNewUserOptions = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        password: 'password',
      };

      await service.createUser(createUserDto);
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining(createUserDto));
    });
  });

  describe('getUserRecord', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      const userResponseDto: UserResponseDTO = {
        id: 'uuid',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };

      mockUserRepository.findOne.mockResolvedValueOnce(userResponseDto);

      const result = await service.getUserRecord({ identifier: email, identifierType: 'email' });
      expect(result).toEqual(userResponseDto);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email },
        relations: ['profile', 'organisationMembers', 'created_organisations', 'owned_organisations'],
      });
    });

    it('should return a user by id', async () => {
      const id = '1';
      const userResponseDto: UserResponseDTO = {
        id: 'some-uuid-here',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };

      mockUserRepository.findOne.mockResolvedValueOnce(userResponseDto);

      const result = await service.getUserRecord({ identifier: id, identifierType: 'id' });
      expect(result).toEqual(userResponseDto);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['profile', 'organisationMembers', 'created_organisations', 'owned_organisations'],
      });
    });

    it('should handle exceptions gracefully', async () => {
      const identifierOptions: UserIdentifierOptionsType = { identifier: 'unknown', identifierType: 'email' };

      mockUserRepository.findOne.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      await expect(service.getUserRecord(identifierOptions)).rejects.toThrow('Test error');
    });
  });

  describe('updateUser', () => {
    const userId = 'valid-id';
    const updateOptions: UpdateUserDto = {
      first_name: 'Jane',
      last_name: 'Doe',
      phone_number: '1234567890',
    };
    const existingUser = {
      id: userId,
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '0987654321',
      user_type: UserType.USER,
    };
    const updatedUser = { ...existingUser, ...updateOptions };

    const superAdminPayload: UserPayload = {
      id: 'super-admin-id',
      email: 'superadmin@example.com',
      user_type: UserType.SUPER_ADMIN,
    };

    const regularUserPayload: UserPayload = {
      id: userId,
      email: 'user@example.com',
      user_type: UserType.USER,
    };

    const anotherUserPayload: UserPayload = {
      id: 'another-user-id',
      email: 'anotheruser@example.com',
      user_type: UserType.USER,
    };

    it('should allow super admin to update any user', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ ...superAdminPayload, user_type: UserType.SUPER_ADMIN });
      mockUserRepository.save.mockResolvedValueOnce(updatedUser);

      const result = await service.updateUser(userId, updateOptions, { id: superAdminPayload.id });

      expect(result).toEqual({
        status: 'success',
        message: 'User Updated Successfully',
        user: {
          id: userId,
          name: 'Jane Doe',
          phone_number: '1234567890',
        },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['profile', 'organisationMembers', 'created_organisations', 'owned_organisations'],
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should allow user to update their own details', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ ...regularUserPayload, user_type: UserType.USER });
      mockUserRepository.save.mockResolvedValueOnce(updatedUser);

      const result = await service.updateUser(userId, updateOptions, { id: regularUserPayload.id });

      expect(result).toEqual({
        status: 'success',
        message: 'User Updated Successfully',
        user: {
          id: userId,
          name: 'Jane Doe',
          phone_number: '1234567890',
        },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['profile', 'organisationMembers', 'created_organisations', 'owned_organisations'],
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should throw ForbiddenException when regular user tries to update another user', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ ...anotherUserPayload, user_type: UserType.USER });

      await expect(service.updateUser(userId, updateOptions, { id: anotherUserPayload.id })).rejects.toThrow(
        ForbiddenException
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['profile', 'organisationMembers', 'created_organisations', 'owned_organisations'],
      });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid userId', async () => {
      const invalidUserId = 'invalid-id';
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.updateUser(invalidUserId, updateOptions, superAdminPayload)).rejects.toThrow(
        NotFoundException
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: invalidUserId },
        relations: ['profile', 'organisationMembers', 'created_organisations', 'owned_organisations'],
      });
    });

    it('should throw BadRequestException for missing userId', async () => {
      const emptyUserId = '';

      await expect(service.updateUser(emptyUserId, updateOptions, superAdminPayload)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate a user', async () => {
      const userId = '1';
      const deactivationDetails: DeactivateAccountDto = {
        confirmation: true,
        reason: 'User requested deactivation',
      };
      const userToUpdate = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'test@example.com',
        password: 'hashedpassword',
        is_active: true,
        attempts_left: 3,
        time_left: 60,
      };

      mockUserRepository.findOne.mockResolvedValueOnce(userToUpdate);

      const result = await service.deactivateUser(userId, deactivationDetails);

      expect(result.is_active).toBe(false);
      expect(result.message).toBe('Account Deactivated Successfully');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['profile', 'organisationMembers', 'created_organisations', 'owned_organisations'],
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...userToUpdate, is_active: false });
    });

    it('should throw an error if user is not found', async () => {
      const userId = '1';
      const deactivationDetails: DeactivateAccountDto = {
        confirmation: true,
        reason: 'User requested deactivation',
      };

      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.deactivateUser(userId, deactivationDetails)).rejects.toThrow(HttpException);
      await expect(service.deactivateUser(userId, deactivationDetails)).rejects.toHaveProperty('response', {
        status_code: 404,
        error: 'User not found',
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['profile', 'organisationMembers', 'created_organisations', 'owned_organisations'],
      });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getUserByDataByIdWithoutPassword', () => {
    const userId = 'valid-id';
    const userWithoutPassword = {
      id: userId,
      first_name: 'John',
      last_name: 'Doe',
      email: 'test@example.com',
      is_active: true,
    };

    it('should return user data without password', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ password: 'hashedpassword', ...userWithoutPassword });

      const result = await service.getUserDataWithoutPasswordById(userId);

      expect(result.user).toEqual(userWithoutPassword);
      expect(result.user).not.toHaveProperty('password');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['profile', 'organisationMembers', 'created_organisations', 'owned_organisations'],
      });
    });
  });

  describe('getAllUsers', () => {
    const page = 1;
    const limit = 10;
    const superAdminPayload: UserPayload = {
      id: 'super-admin-id',
      email: 'superadmin@example.com',
      user_type: UserType.SUPER_ADMIN,
    };
    const regularUserPayload: UserPayload = {
      id: 'regular-user-id',
      email: 'user@example.com',
      user_type: UserType.USER,
    };

    it('should return users when called by super admin', async () => {
      const users = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          is_active: true,
          created_at: new Date('2023-01-01T00:00:00Z'),
        },
        {
          id: '2',
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          phone: '0987654321',
          is_active: false,
          created_at: new Date('2023-01-02T00:00:00Z'),
        },
      ];
      const total = 2;

      mockUserRepository.findOne.mockResolvedValueOnce({ ...superAdminPayload, user_type: UserType.SUPER_ADMIN });
      mockUserRepository.findAndCount.mockResolvedValueOnce([users, total]);

      const result = await service.getUsersByAdmin(page, limit, { id: superAdminPayload.id });

      expect(result).toEqual({
        status: 'success',
        message: 'Users retrieved successfully',
        data: {
          users: users.map(user => ({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            phone_number: user.phone,
            is_active: user.is_active,
            created_at: user.created_at,
          })),
          pagination: {
            current_page: page,
            total_pages: 1,
            total_users: total,
          },
        },
      });
      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        select: ['id', 'first_name', 'last_name', 'email', 'phone', 'is_active', 'created_at'],
        skip: 0,
        take: limit,
        order: { created_at: 'DESC' },
      });
    });

    it('should throw ForbiddenException when called by non-super admin', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ ...regularUserPayload, user_type: UserType.USER });

      await expect(service.getUsersByAdmin(page, limit, { id: regularUserPayload.id })).rejects.toThrow(
        ForbiddenException
      );
      expect(mockUserRepository.findAndCount).not.toHaveBeenCalled();
    });
  });
});
