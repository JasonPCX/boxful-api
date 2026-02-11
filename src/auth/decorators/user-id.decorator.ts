import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthInfo } from '../models/auth-info.model';

/**
 * Decorator personalizado para extraer el userId del usuario autenticado
 * Uso: @UserId() userId: string
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthInfo }>();
    return request.user.userId;
  },
);
