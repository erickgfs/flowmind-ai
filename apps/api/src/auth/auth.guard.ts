import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthUser, JwtPayload } from './auth.types.js';

// Um Guard é o "porteiro" da rota: roda ANTES do controller e decide se a
// requisição entra (true) ou é barrada (exceção -> 401).
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente');
    }

    try {
      // verifyAsync confere a assinatura (com o JWT_SECRET) e a validade (exp).
      // Token adulterado ou vencido -> lança erro.
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      request.user = { id: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
    return true;
  }

  // Formato esperado do cabeçalho: "Authorization: Bearer <token>"
  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
