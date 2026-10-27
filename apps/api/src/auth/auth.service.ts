import { HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import { DevLoginInput, Provider, PublicUser, SocialLoginInput } from "@splitmind/contract";
import { createHash, randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { apiError } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";
import { randomNickname } from "./nicknames";

const REFRESH_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async socialLogin(input: SocialLoginInput) {
    const profile = await this.verifyProvider(input.provider, input.token);
    const user = await this.findOrCreate(input.provider, profile.providerId);
    return this.issue(await this.stampTerms(user));
  }

  async devLogin(input: DevLoginInput) {
    if (process.env.ALLOW_DEV_LOGIN !== "true") {
      apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "개발용 로그인을 사용할 수 없습니다.");
    }
    const user = await this.findOrCreate(input.provider, input.providerId);
    return this.issue(await this.stampTerms(user));
  }

  async ensureNickname(user: User) {
    if (user.nickname || user.deletedAt) return user;
    return this.claimNickname(user.id);
  }

  async refresh(refreshToken: string) {
    const refreshHash = this.hash(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!session) apiError(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "다시 로그인해 주세요.");
    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return this.issue(session.user);
  }

  async logout(refreshToken: string) {
    const refreshHash = this.hash(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async issue(user: User) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      provider: user.provider,
      isAdmin: user.isAdmin,
      isAdult: user.isAdult,
    });
    const refreshToken = randomBytes(32).toString("base64url");
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshHash: this.hash(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_MS),
      },
    });
    return { accessToken, refreshToken, user: this.toPublic(user) };
  }

  toPublic(user: User): PublicUser {
    return {
      id: user.id,
      provider: user.provider,
      nickname: user.nickname,
      createdAt: user.createdAt.toISOString(),
      isAdmin: user.isAdmin,
      isAdult: user.isAdult,
    };
  }

  async withdraw(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) apiError(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "사용자를 찾을 수 없습니다.");
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.comment.updateMany({
        where: { userId, deletedAt: null },
        data: { deletedAt: now, content: "" },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: now,
          nickname: null,
          isAdmin: false,
          providerId: `withdrawn:${userId}`,
        },
      }),
    ]);
  }

  private async findOrCreate(provider: Provider, providerId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { provider_providerId: { provider, providerId } },
    });
    if (existing) return this.ensureNickname(existing);
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        return await this.prisma.user.create({
          data: { provider, providerId, nickname: randomNickname() },
        });
      } catch (err) {
        const target = uniqueTarget(err);
        if (target?.includes("provider_id")) {
          const row = await this.prisma.user.findUnique({
            where: { provider_providerId: { provider, providerId } },
          });
          if (row) return this.ensureNickname(row);
        }
        if (target?.includes("nickname")) continue;
        throw err;
      }
    }
    apiError(HttpStatus.CONFLICT, "NICKNAME_TAKEN", "닉네임을 만들지 못했습니다.");
  }

  private async claimNickname(userId: string) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        return await this.prisma.user.update({
          where: { id: userId },
          data: { nickname: randomNickname() },
        });
      } catch (err) {
        if (uniqueTarget(err)?.includes("nickname")) continue;
        throw err;
      }
    }
    apiError(HttpStatus.CONFLICT, "NICKNAME_TAKEN", "닉네임을 만들지 못했습니다.");
  }

  private async stampTerms(user: User) {
    if (user.termsAgreedAt || user.deletedAt) return user;
    return this.prisma.user.update({
      where: { id: user.id },
      data: { termsAgreedAt: new Date() },
    });
  }

  private hash(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private async verifyProvider(provider: Provider, token: string) {
    if (provider === "kakao") {
      const body = await this.providerJson("https://kapi.kakao.com/v2/user/me", token, "카카오");
      return { providerId: String(body.id), nickname: body.kakao_account?.profile?.nickname as string | undefined };
    }
    if (provider === "naver") {
      const body = await this.providerJson("https://openapi.naver.com/v1/nid/me", token, "네이버");
      const profile = body.response ?? {};
      return { providerId: String(profile.id), nickname: (profile.nickname ?? profile.name) as string | undefined };
    }
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
    if (!response.ok) apiError(HttpStatus.UNAUTHORIZED, "INVALID_PROVIDER_TOKEN", "구글 토큰을 확인할 수 없습니다.");
    const body = (await response.json()) as { sub?: string; name?: string };
    if (!body.sub) apiError(HttpStatus.UNAUTHORIZED, "INVALID_PROVIDER_TOKEN", "구글 토큰을 확인할 수 없습니다.");
    return { providerId: body.sub, nickname: body.name };
  }

  private async providerJson(url: string, token: string, label: string) {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      apiError(HttpStatus.UNAUTHORIZED, "INVALID_PROVIDER_TOKEN", `${label} 토큰을 확인할 수 없습니다.`);
    }
    return (await response.json()) as Record<string, any>;
  }
}

function uniqueTarget(err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = err.meta?.target;
    return Array.isArray(target) ? target.join(",") : String(target ?? "");
  }
  return null;
}
