import { IsNotEmpty, IsString } from 'class-validator';

export class CreateHelpCenterTopicDTO {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
