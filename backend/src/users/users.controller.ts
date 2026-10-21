import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Role, UserStatus } from '../common/types';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'] as const;
const STATUSES = ['ACTIVE', 'LOCKED', 'DISABLED'] as const;

class CreateUserDto {
  @IsString() username: string;
  @IsEmail() email: string;
  @IsString() fullName: string;
  @IsEnum(ROLES) role: Role;
  @IsString() @MinLength(6) password: string;
}

class UpdateUserDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsEnum(ROLES) role?: Role;
  @IsOptional() @IsEnum(STATUSES) status?: UserStatus;
}

class ChangePasswordDto {
  @IsString() @MinLength(6) newPassword: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findAll() {
    return { success: true, data: await this.usersService.findAll() };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.usersService.findById(id) };
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  async create(@Body() dto: CreateUserDto, @Request() req: any) {
    const user = await this.usersService.create(dto);
    return { success: true, data: user, message: 'Tạo người dùng thành công' };
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req: any) {
    const user = await this.usersService.update(id, dto, req.user.sub, req.user.role);
    return { success: true, data: user, message: 'Cập nhật thành công' };
  }

  @Patch(':id/password')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async changePassword(@Param('id') id: string, @Body() dto: ChangePasswordDto) {
    await this.usersService.changePassword(id, dto.newPassword);
    return { success: true, message: 'Đổi mật khẩu thành công' };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.usersService.delete(id, req.user.sub, req.user.role);
    return { success: true, message: 'Xóa người dùng thành công' };
  }
}
