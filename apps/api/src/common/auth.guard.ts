import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { HttpStatus } from "@nestjs/common";
import { apiError } from "./http";
import { PrismaService } from "../prisma/prisma.service";

export const IS_PUBLIC = "isPublic";
export const IS_ADMIN = "isAdmin";

export type AuthUser = {
  id: string;
  provider: "kakao" | "naver" | "google";
  isAdmin: boolean;
  isAdult: boolean;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;

    if (!header?.startsWith("Bearer ")) {
      if (isPublic) return true;
      apiError(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "로그인이 필요합니다.");
    }

    try {
      const payload = this.jwt.verify(header.slice("Bearer ".length));
      request.user = {
        id: payload.sub,
        provider: payload.provider,
        isAdmin: Boolean(payload.isAdmin),
        isAdult: Boolean(payload.isAdult),
      } satisfies AuthUser;
      const row = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { deletedAt: true },
      });
      if (!row || row.deletedAt) {
        apiError(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "로그인이 필요합니다.");
      }
    } catch {
      apiError(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "로그인이 필요합니다.");
    }

    const adminOnly = this.reflector.getAllAndOverride<boolean>(IS_ADMIN, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (adminOnly && !request.user.isAdmin) {
      apiError(HttpStatus.FORBIDDEN, "FORBIDDEN", "관리자만 사용할 수 있습니다.");
    }
    return true;
  }
}
