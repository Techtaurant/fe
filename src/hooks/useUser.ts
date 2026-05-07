'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { User } from '../types';
import { httpClient } from '../utils/httpClient';

interface UseUserResult {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface MeResponse {
  data: User;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUser(value: unknown): value is User {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' || typeof value.id === 'number';
}

function isMeResponse(value: unknown): value is MeResponse {
  if (!isRecord(value)) return false;
  return isUser(value.data);
}

function toUser(value: unknown): User | null {
  if (!isRecord(value)) return null;

  const id = value.id;
  if (typeof id !== 'string' && typeof id !== 'number') return null;

  const name =
    typeof value.name === 'string'
      ? value.name
      : typeof value.nickname === 'string'
        ? value.nickname
        : '';
  const email = typeof value.email === 'string' ? value.email : '';
  const profileImageUrl =
    typeof value.profileImageUrl === 'string'
      ? value.profileImageUrl
      : typeof value.profileImageUrl === 'undefined' || value.profileImageUrl === null
        ? ''
        : '';
  const role = typeof value.role === 'string' ? value.role : 'USER';
  const followerCount =
    typeof value.followerCount === 'number' ? value.followerCount : undefined;
  const followingCount =
    typeof value.followingCount === 'number' ? value.followingCount : undefined;

  return {
    id: String(id),
    name,
    email,
    profileImageUrl,
    role,
    followerCount,
    followingCount,
  };
}

export function useUser(): UseUserResult {
  const query = useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: async (): Promise<User | null> => {
      const response = await httpClient('/api/users/me', {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error('사용자 정보를 가져오는데 실패했습니다.');
      }

      const result: unknown = await response.json();
      const userData = isMeResponse(result)
        ? toUser(result.data)
        : toUser(result);

      if (!userData) {
        throw new Error('사용자 응답 형식이 올바르지 않습니다.');
      }

      return userData;
    },
  });

  return {
    user: query.data ?? null,
    isLoading: query.isPending,
    error: query.error as Error | null,
    refetch: () => {
      void query.refetch();
    },
  };
}
