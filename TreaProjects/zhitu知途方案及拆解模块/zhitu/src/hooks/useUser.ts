'use client';

import { useState, useEffect } from 'react';

const USER_ID_KEY = 'zhitu-user-id';

function getOrCreateUserId(): { userId: string; isReturning: boolean } {
  if (typeof window === 'undefined') {
    return { userId: '', isReturning: false };
  }

  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) {
    return { userId: existing, isReturning: true };
  }

  const newId = crypto.randomUUID();
  localStorage.setItem(USER_ID_KEY, newId);
  return { userId: newId, isReturning: false };
}

export function useUser() {
  const [user, setUser] = useState<{ userId: string; isReturning: boolean }>({
    userId: '',
    isReturning: false,
  });

  useEffect(() => {
    setUser(getOrCreateUserId());
  }, []);

  return user;
}
