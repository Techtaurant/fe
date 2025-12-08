'use client';

import { useState, useEffect } from 'react';
import { User } from '../types';
import { httpClient } from '../utils/httpClient';

interface UseUserResult {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // httpClient 사용 - 자동 토큰 갱신 포함
      const response = await httpClient('/api/users/me', {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          return;
        }
        throw new Error('사용자 정보를 가져오는데 실패했습니다.');
      }

      const result = await response.json();
      setUser(result.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류'));
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, isLoading, error, refetch: fetchUser };
}
