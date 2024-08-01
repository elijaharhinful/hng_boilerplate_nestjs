import { AbstractBaseEntity } from 'src/entities/base.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'help-center-topics' })
export class HelpCenterTopic extends AbstractBaseEntity {
  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false, type: 'text' })
  content: string;

  @Column({ nullable: false })
  author: string;

  @Column({ nullable: false, default: false })
  is_deleted: boolean;

  @ManyToOne(() => User, user => user.helpCenterTopics)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
