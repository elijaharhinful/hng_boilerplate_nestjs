import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/modules/user/entities/user.entity';
import { Profile } from '../../../profile/entities/profile.entity';
import { OrganisationMember } from 'src/modules/organisations/entities/org-members.entity';
import { UserType } from 'src/modules/user/entities/user.entity';

export const mockHelpCenterRepository = async (): Promise<User> => {
  const profileMock: Profile = {
    id: uuidv4(),
    username: 'mockuser',
    jobTitle: 'Developer',
    pronouns: 'They/Them',
    department: 'Engineering',
    email: 'mockuser@example.com',
    bio: 'A mock user for testing purposes',
    social_links: [],
    language: 'English',
    region: 'US',
    timezones: 'America/New_York',
    profile_pic_url: '',
    created_at: new Date(),
    updated_at: new Date(),
    user_id: null,
  };

  const orgMemberMock: OrganisationMember = {
    id: uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    user_id: null,
    role: 'admin',
    organisation_id: null,
    profile_id: profileMock,
  };

  return {
    id: uuidv4(),
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    password: 'Password.123',
    hashPassword: async () => {},
    phone: '1234567890',
    is_active: true,
    backup_codes: [],
    attempts_left: 3,
    time_left: 60,
    secret: 'somesecret',
    is_2fa_enabled: true,
    user_type: UserType.SUPER_ADMIN,
    created_at: new Date(),
    updated_at: new Date(),
    owned_organisations: [],
    created_organisations: [],
    invites: [],
    jobs: [],
    testimonials: [],
    profile: profileMock,
    organisationMembers: [orgMemberMock],
    notifications: [],
    notifications_settings: [],
    helpCenterTopics: [],
  };
};

export const mockUser = mockHelpCenterRepository();
