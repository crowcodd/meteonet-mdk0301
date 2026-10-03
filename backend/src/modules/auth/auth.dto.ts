import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Role } from '@/domain/enums';

export class LoginDto {
  @ApiProperty({ example: 'observer1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  login: string;

  @ApiProperty({ example: 'observer123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class TokensDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
}

export class MeStationDto {
  @ApiProperty() id: number;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
}

export class MeDto {
  @ApiProperty() id: number;
  @ApiProperty() login: string;
  @ApiProperty() fullName: string;
  @ApiProperty({ enum: Role, enumName: 'Role' }) role: Role;
  @ApiProperty({ type: MeStationDto, nullable: true }) station: MeStationDto | null;
}
