import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import appConfig from '../../config/auth.config';
import { IS_PUBLIC_KEY } from '../helpers/skipAuth';
import { UNAUTHENTICATED_MESSAGE } from '../helpers/SystemMessages';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublicRoute) {
      return true;
    }

    if (!token) {
      throw new UnauthorizedException({
        message: UNAUTHENTICATED_MESSAGE,
        status_code: HttpStatus.UNAUTHORIZED,
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: appConfig().jwtSecret,
      });

      if (this.isExpiredToken(payload)) {
        throw new UnauthorizedException({
          message: UNAUTHENTICATED_MESSAGE,
          status_code: HttpStatus.UNAUTHORIZED,
        });
      }

      request['user'] = payload;
      request['token'] = token;
      return true;
    } catch (e) {
      throw new UnauthorizedException({
        message: UNAUTHENTICATED_MESSAGE,
        status_code: HttpStatus.UNAUTHORIZED,
      });
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private isExpiredToken(token: any): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return token.exp < currentTime;
  }
}
