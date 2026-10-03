import { Body, Controller, Get, HttpCode, Module, Post } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser, Public } from './auth.decorators';
import { LoginDto, MeDto, RefreshDto, TokensDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: TokensDto })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.login, dto.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOkResponse({ type: TokensDto })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(204)
  logout(@CurrentUser() user: AuthUser) {
    return this.auth.logout(user.id);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOkResponse({ type: MeDto })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}

@Module({
  imports: [JwtModule.register({ global: true })],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
