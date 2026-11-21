import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from './auth.types.js';

// Decorator de parâmetro: em vez de escrever `@Req() req` e `req.user` em
// toda rota, escrevemos `@CurrentUser() user: AuthUser`.
// Só funciona em rotas protegidas pelo AuthGuard (é ele quem preenche request.user).
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);
