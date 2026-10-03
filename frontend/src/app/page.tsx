'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { homeFor, useMe } from '@/modules/auth';

export default function Home() {
  const router = useRouter();
  const { data: me, token, isError } = useMe();

  useEffect(() => {
    if (token === null || isError) router.replace('/login');
    else if (me) router.replace(homeFor(me.role));
  }, [token, me, isError, router]);

  // страница только перенаправляет, показывать на ней нечего
  return null;
}
