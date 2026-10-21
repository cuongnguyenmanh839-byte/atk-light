import {
  Controller, Post, Body, UseGuards, Request, Get, HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsString() username: string;
  @IsString() password: string;
}

class RefreshDto {
  @IsString() refreshToken: string;
}

class LogoutDto {
  @IsString() refreshToken: string;
}

class ChangePasswordDto {
  @IsString() oldPassword: string;
  @IsString() @MinLength(6) newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.username, dto.password);
    return { success: true, data: result, message: 'Đăng nhập thành công' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto) {
    const tokens = await this.authService.refresh(dto.refreshToken);
    return { success: true, data: tokens };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logout(dto.refreshToken);
    return { success: true, message: 'Đã đăng xuất' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req: any) {
    return { success: true, data: req.user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(200)
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(req.user.sub, dto.oldPassword, dto.newPassword);
    return { success: true, message: 'Đổi mật khẩu thành công' };
  }
}
