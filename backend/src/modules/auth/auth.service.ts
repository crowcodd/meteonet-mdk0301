import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@/domain/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { MeDto, TokensDto } from './auth.dto';

interface TokenSubject {
  id: number;
  role: string;
  stationId: number | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(login: string, password: string): Promise<TokensDto> {
    const user = await this.prisma.user.findUnique({ where: { login } });
    // специально отвечаем одинаково и когда нет пользователя, и когда пароль неверный
    if (!user || !(await Bun.password.verify(password, user.passwordHash))) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    return this.issue(user);
  }

  /** выдаём новую пару, старый refresh после этого уже не сработает */
  async refresh(refreshToken: string): Promise<TokensDto> {
    let userId: number;
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
      userId = Number(payload.sub);
    } catch {
      throw new UnauthorizedException('Refresh-токен недействителен');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshTokenHash || !(await Bun.password.verify(refreshToken, user.refreshTokenHash))) {
      throw new UnauthorizedException('Refresh-токен отозван');
    }
    return this.issue(user);
  }

  async logout(userId: number): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
  }

  async me(userId: number): Promise<MeDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { station: { select: { id: true, code: true, name: true } } },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return { id: user.id, login: user.login, fullName: user.fullName, role: user.role as Role, station: user.station };
  }

  private async issue(user: TokenSubject): Promise<TokensDto> {
    const payload = { sub: user.id, role: user.role, stationId: user.stationId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as never,
      }),
      this.jwt.signAsync(
        { sub: user.id, jti: crypto.randomUUID() },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: (process.env.JWT_REFRESH_TTL ?? '7d') as never },
      ),
    ]);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: await Bun.password.hash(refreshToken) },
    });
    return { accessToken, refreshToken };
  }
}
