import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Role, UserStatus } from '../common/types';
import { hasRoleLevel } from '../common/types';
import * as bcrypt from 'bcrypt';

export type SafeUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  avatar: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map(this.toSafe);
  }

  async findById(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return this.toSafe(user);
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username: username.toLowerCase() } });
  }

  async create(data: {
    username: string;
    email: string;
    fullName: string;
    role: Role;
    password: string;
  }): Promise<SafeUser> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: data.username.toLowerCase() }, { email: data.email.toLowerCase() }] },
    });
    if (existing) throw new ConflictException('Tên đăng nhập hoặc email đã tồn tại');
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: {
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        fullName: data.fullName,
        role: data.role,
        passwordHash,
      },
    });
    return this.toSafe(user);
  }

  async update(
    id: string,
    data: Partial<{ fullName: string; email: string; role: Role; status: UserStatus }>,
    requesterId: string,
    requesterRole: Role,
  ): Promise<SafeUser> {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Người dùng không tồn tại');
    // ADMIN không được sửa SUPER_ADMIN
    if (requesterRole === 'ADMIN' && target.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Không thể sửa tài khoản SUPER_ADMIN');
    }
    // Không được tự nâng quyền thành SUPER_ADMIN
    if (data.role === 'SUPER_ADMIN' && requesterRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Không đủ quyền để cấp SUPER_ADMIN');
    }
    const user = await this.prisma.user.update({ where: { id }, data });
    return this.toSafe(user);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  async delete(id: string, requesterId: string, requesterRole: Role): Promise<void> {
    if (id === requesterId) throw new ForbiddenException('Không thể tự xóa tài khoản đang đăng nhập');
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Người dùng không tồn tại');
    if (requesterRole === 'ADMIN' && target.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Không thể xóa tài khoản SUPER_ADMIN');
    }
    await this.prisma.user.delete({ where: { id } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  private toSafe(user: any): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
