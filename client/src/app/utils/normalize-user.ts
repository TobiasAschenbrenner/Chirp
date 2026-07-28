import { ApiUser } from '../models/api-user.model';
import { User } from '../models/user.model';

function toId(ref: string | { _id: string }): string {
  return typeof ref === 'string' ? ref : ref._id;
}

function normalizeIdList<T extends string | { _id: string }>(list?: T[]): string[] | undefined {
  if (!Array.isArray(list)) return undefined;
  return list.map(toId);
}

export function normalizeUser(api: ApiUser): User {
  return {
    _id: api._id,
    fullName: api.fullName,

    email: api.email,
    profilePhoto: api.profilePhoto,
    bio: api.bio,

    followers: normalizeIdList(api.followers),
    following: normalizeIdList(api.following),
    posts: normalizeIdList(api.posts),
  };
}
