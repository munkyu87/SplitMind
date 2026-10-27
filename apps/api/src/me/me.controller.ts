import { Body, Controller, Delete, Get, HttpCode, Patch, Post } from "@nestjs/common";
import { adultSchema, profileSchema } from "@splitmind/contract";
import { AuthService } from "../auth/auth.service";
import { AuthUser } from "../common/auth.guard";
import { CurrentUser } from "../common/decorators";
import { apiError } from "../common/http";
import { HttpStatus } from "@nestjs/common";
import { ZodPipe } from "../common/zod.pipe";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SuggestionsService } from "../suggestions/suggestions.service";

@Controller("me")
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly suggestions: SuggestionsService,
  ) {}

  @Get()
  async me(@CurrentUser() user: AuthUser) {
    const row = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!row || row.deletedAt) apiError(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "사용자를 찾을 수 없습니다.");
    return this.auth.toPublic(await this.auth.ensureNickname(row));
  }

  @Patch()
  async update(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(profileSchema)) body: ReturnType<typeof profileSchema.parse>,
  ) {
    try {
      const row = await this.prisma.user.update({
        where: { id: user.id },
        data: { nickname: body.nickname },
      });
      return this.auth.toPublic(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        apiError(HttpStatus.CONFLICT, "NICKNAME_TAKEN", "이미 쓰는 닉네임입니다.");
      }
      throw err;
    }
  }

  @Delete()
  @HttpCode(204)
  async withdraw(@CurrentUser() user: AuthUser) {
    await this.auth.withdraw(user.id);
  }

  @Post("adult")
  async adult(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(adultSchema)) _body: ReturnType<typeof adultSchema.parse>,
  ) {
    const row = await this.prisma.user.update({
      where: { id: user.id },
      data: { isAdult: true },
    });
    return this.auth.issue(row);
  }

  @Get("suggestions")
  suggestionsOf(@CurrentUser() user: AuthUser) {
    return this.suggestions.mine(user);
  }

  @Get("answers")
  async answers(@CurrentUser() user: AuthUser) {
    const rows = await this.prisma.userAnswer.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            status: true,
            choices: { select: { choiceIndex: true, content: true } },
            categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
          },
        },
      },
    });
    return rows
      .filter((row) => row.question.status === "published")
      .map((row) => ({
        questionId: row.question.id,
        title: row.question.title,
        choiceIndex: row.choiceIndex,
        choice: row.question.choices.find((choice) => choice.choiceIndex === row.choiceIndex)?.content ?? "",
        createdAt: row.createdAt.toISOString(),
        categories: row.question.categories.map((item) => item.category),
      }));
  }
}
