import { RiderGroup } from '../../types';

export interface IGroupRepository {
  getGroups(search?: string): Promise<RiderGroup[]>;
  getGroupById(id: string): Promise<RiderGroup | null>;
  getUserGroups(userId: string): Promise<RiderGroup[]>;
  joinGroup(groupId: string, userId: string): Promise<void>;
  leaveGroup(groupId: string, userId: string): Promise<void>;
}
