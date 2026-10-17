import { IGroupRepository } from '../interfaces/IGroupRepository';
import { RiderGroup } from '../../types';
import { mockGroups } from '../../data/posts';

export class MockGroupRepository implements IGroupRepository {
  private groups: RiderGroup[] = [...mockGroups];
  private joinedGroups: Set<string> = new Set(['grp-1']);

  async getGroups(search?: string): Promise<RiderGroup[]> {
    let list = this.groups.map((g) => ({
      ...g,
      isJoined: this.joinedGroups.has(g.id),
    }));

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((g) => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    }

    return list;
  }

  async getGroupById(id: string): Promise<RiderGroup | null> {
    const g = this.groups.find((group) => group.id === id);
    if (!g) return null;
    return {
      ...g,
      isJoined: this.joinedGroups.has(g.id),
    };
  }

  async getUserGroups(userId: string): Promise<RiderGroup[]> {
    return this.groups
      .filter((g) => this.joinedGroups.has(g.id))
      .map((g) => ({ ...g, isJoined: true }));
  }

  async joinGroup(groupId: string, userId: string): Promise<void> {
    this.joinedGroups.add(groupId);
    const g = this.groups.find((group) => group.id === groupId);
    if (g) {
      g.membersCount += 1;
    }
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    this.joinedGroups.delete(groupId);
    const g = this.groups.find((group) => group.id === groupId);
    if (g && g.membersCount > 0) {
      g.membersCount -= 1;
    }
  }
}
