import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { Role } from '../../common/types';
import { ROLE_LEVEL } from '../../common/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Bạn chưa đăng nhập');

    const hasRole = requiredRoles.some(
      (r) => ROLE_LEVEL[user.role as Role] >= ROLE_LEVEL[r],
    );
    if (!hasRole) throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    return true;
  }
}
