import { User } from '../../user/shared/model/user.model';

export class UserFollow {
  id: number;
  follower: User;
  following: User;
  createdAt: Date;
}