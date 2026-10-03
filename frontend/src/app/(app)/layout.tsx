import { AppShell } from '@/modules/shell';

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return <AppShell>{children}</AppShell>;
}
