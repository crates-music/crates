import { User } from '../../user/shared/model/user.model';
import { Crate } from '../../crate/shared/model/crate.model';

export interface UnifiedSearchResponse {
  users: User[];
  crates: Crate[];
}