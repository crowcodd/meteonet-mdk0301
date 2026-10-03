'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CloudSun } from '@phosphor-icons/react/ssr';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Panel, PanelBody } from '@/components/ui/panel';
import { Alert } from '@/components/ui/states';
import { getErrorMessage } from '@/shared/http';
import { useLogin } from '../hooks/useAuthActions';

const schema = z.object({
  login: z.string().trim().min(1, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
});

// учётки из seed, чтобы на демо не вспоминать пароли
const DEMO = [
  { login: 'observer1', password: 'observer123', who: 'Наблюдатель, станция Киров' },
  { login: 'manager', password: 'manager123', who: 'Руководитель центра' },
];

export function LoginForm() {
  const login = useLogin();
  const { register, handleSubmit, formState, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { login: '', password: '' },
  });

  return (
    <div className="grid min-h-[100dvh] md:grid-cols-[1.1fr_1fr]">
      <section className="flex flex-col justify-between gap-12 px-6 py-10 md:px-14 md:py-14">
        <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <CloudSun size={22} className="text-accent" /> Метеосеть
        </div>
        <div className="max-w-xl animate-rise">
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tighter md:text-6xl">
            Наблюдения сети станций в одном месте
          </h1>
          <p className="mt-5 max-w-[44ch] text-[17px] leading-relaxed text-ink-2">
            Ввод замеров, автоматическая проверка качества и разбор аномалий для регионального центра.
          </p>
        </div>
        <p className="text-[13px] text-ink-3">Лабораторная работа №3, МДК 03.01</p>
      </section>

      <section className="flex items-center px-4 pb-10 md:px-10 md:py-10">
        <div className="w-full max-w-md animate-rise [animation-delay:80ms]">
          <Panel>
            <PanelBody className="pt-6">
              <h2 className="text-lg font-semibold tracking-tight">Вход</h2>
              <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit((v) => login.mutate(v))} noValidate>
                <Field label="Логин" error={formState.errors.login?.message}>
                  <Input autoComplete="username" aria-invalid={!!formState.errors.login} {...register('login')} />
                </Field>
                <Field label="Пароль" error={formState.errors.password?.message}>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!formState.errors.password}
                    {...register('password')}
                  />
                </Field>
                {login.isError && <Alert>{getErrorMessage(login.error)}</Alert>}
                <Button type="submit" disabled={login.isPending} className="mt-1 self-start" trailing={<ArrowRight size={16} />}>
                  {login.isPending ? 'Входим' : 'Войти'}
                </Button>
              </form>
            </PanelBody>
          </Panel>

          <div className="mt-5 px-2">
            <p className="text-[13px] text-ink-3">Демо-доступ, нажмите, чтобы подставить</p>
            <div className="mt-2 flex flex-col">
              {DEMO.map((d) => (
                <button
                  key={d.login}
                  type="button"
                  onClick={() => {
                    setValue('login', d.login, { shouldValidate: true });
                    setValue('password', d.password, { shouldValidate: true });
                  }}
                  className="flex items-baseline justify-between gap-4 rounded-xl px-3 py-2 text-left transition-colors duration-200 hover:bg-ink/[0.04]"
                >
                  <span className="font-mono text-[13px]">{d.login}</span>
                  <span className="text-[13px] text-ink-3">{d.who}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
