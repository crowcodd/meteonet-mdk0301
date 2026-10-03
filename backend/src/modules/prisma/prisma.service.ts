import { Global, Injectable, Module, type OnModuleDestroy } from '@nestjs/common';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@/generated/prisma/client';

const adapter = () => new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:./dev.db' });

/** клиент для кода вне Nest, например для seed */
export function createPrismaClient(): PrismaClient {
  return new PrismaClient({ adapter: adapter() });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: adapter() });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

/** клиент внутри $transaction, его передаём в методы, которые работают в транзакции */
export type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>;

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
