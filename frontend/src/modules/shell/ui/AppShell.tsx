'use client';

import { CloudSun, SignOut } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import type { Role } from '@/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/states';
import { cn } from '@/lib/cn';
import { homeFor, useLogout, useMe } from '@/modules/auth';
import { ConnectionIndicator } from '@/modules/outbox';

const NAV: Record<Role, { href: string; label: string }[]> = {
  OBSERVER: [
    { href: '/observer', label: 'Ввод' },
    { href: '/observer/returned', label: 'Возвращённые' },
    { href: '/observer/instruments', label: 'Приборы' },
  ],
  MANAGER: [
    { href: '/manager', label: 'Аномалии' },
    { href: '/manager/failures', label: 'Сбои' },
    { href: '/manager/reports', label: 'Отчёт' },
  ],
};

/** без токена отправляем на вход, с чужой ролью на свою главную */
export function AppShell({ children }: { children: ReactNode }) {
  const { data: me, token, isError } = useMe();
  const logout = useLogout();
  const pathname = usePathname();
  const router = useRouter();

  const home = me ? homeFor(me.role) : null;
  const wrongZone = home !== null && !pathname.startsWith(home);

  useEffect(() => {
    if (token === null || isError) router.replace('/login');
    else if (wrongZone && home) router.replace(home);
  }, [token, isError, wrongZone, home, router]);

  if (!me || wrongZone) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pt-24">
        <Skeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-3 z-20 px-3 md:px-4">
        <div className="mx-auto flex max-w-6xl items-center gap-2 rounded-full bg-surface/80 p-1.5 pl-4 shadow-[0_10px_30px_-12px_rgb(21_23_28/0.18)] ring-1 ring-line backdrop-blur-xl">
          <Link href={home!} className="mr-2 flex shrink-0 items-center gap-2 text-[15px] font-semibold tracking-tight">
            <CloudSun size={20} className="text-accent" />
            <span className="hidden sm:inline">Метеосеть</span>
          </Link>

          <nav className="flex min-w-0 gap-0.5 overflow-x-auto">
            {NAV[me.role].map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-sm whitespace-nowrap text-ink-2 transition-colors duration-300 ease-out-expo hover:text-ink',
                    active && 'bg-ink text-white hover:text-white',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {me.role === 'OBSERVER' && <ConnectionIndicator />}
            <div className="hidden text-right leading-tight md:block">
              <div className="text-[13px] font-medium">{me.station ? me.station.name : 'Центр'}</div>
              <div className="text-[12px] text-ink-3">{me.station ? me.station.code : 'руководитель'}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => logout.mutate()} aria-label="Выйти" title="Выйти">
              <SignOut size={18} />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-16 md:pt-10">{children}</main>
    </div>
  );
}
