import { HttpStatus, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { AiSettingInput, RejectInput } from "@splitmind/contract";
import { AuthUser } from "../common/auth.guard";
import { apiError } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";
import { SuggestionsService } from "../suggestions/suggestions.service";

const DEFAULT_PROMPT = `사용자의 심리를 자극하고, 곤란하고 찐한 상황을 던지는 질문을 1개 생성해줘.
선택지는 반드시 2~4개로 제시하고, 누구나 쉽게 고르지만 찝찝한 고민이 생기게끔 해줘.
유머나 짜증, 자괴감, 도덕 딜레마가 살짝 들어간 걸로. 성적으로 노골적인 표현은 빼.`;

@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly suggestions: SuggestionsService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      this.tick().catch(() => undefined);
    }, 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async pending() {
    const rows = await this.prisma.suggestedQuestion.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      include: { category: true },
    });
    return rows.map((row) => this.suggestions.toDto(row));
  }

  async approve(id: string, admin: AuthUser) {
    return this.prisma.$transaction(async (tx) => {
      const suggestion = await tx.suggestedQuestion.findUnique({ where: { id } });
      if (!suggestion || suggestion.status !== "pending") {
        apiError(HttpStatus.CONFLICT, "NOT_PENDING", "대기 중인 제안만 승인할 수 있습니다.");
      }
      const choices = this.suggestions.parseChoices(suggestion.choices);
      const question = await tx.question.create({
        data: {
          title: suggestion.title,
          source: suggestion.origin === "ai" ? "ai" : "user",
          suggestedBy: suggestion.userId,
          status: "published",
          publishedAt: new Date(),
          choices: {
            create: choices.map((choice, index) => ({
              choiceIndex: index,
              content: choice.content,
              imageUrl: choice.imageUrl,
            })),
          },
          categories: { create: [{ categoryId: suggestion.categoryId }] },
        },
      });
      await tx.suggestedQuestion.update({
        where: { id },
        data: {
          status: "approved",
          questionId: question.id,
          reviewedAt: new Date(),
          reviewedById: admin.id,
        },
      });
      await tx.questionReviewLog.create({
        data: { suggestionId: id, adminId: admin.id, action: "approved" },
      });
      return { questionId: question.id };
    });
  }

  async reject(id: string, input: RejectInput, admin: AuthUser) {
    const suggestion = await this.prisma.suggestedQuestion.findUnique({ where: { id } });
    if (!suggestion || suggestion.status !== "pending") {
      apiError(HttpStatus.CONFLICT, "NOT_PENDING", "대기 중인 제안만 거절할 수 있습니다.");
    }
    await this.prisma.$transaction([
      this.prisma.suggestedQuestion.update({
        where: { id },
        data: {
          status: "rejected",
          reviewReason: input.reason,
          reviewedAt: new Date(),
          reviewedById: admin.id,
        },
      }),
      this.prisma.questionReviewLog.create({
        data: { suggestionId: id, adminId: admin.id, action: "rejected", reason: input.reason },
      }),
    ]);
    return { ok: true };
  }

  async reports() {
    const rows = await this.prisma.commentReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { comment: true },
    });
    return rows.map((row) => ({
      id: row.id,
      commentId: row.commentId,
      reason: row.reason,
      content: row.comment.content,
      deleted: Boolean(row.comment.deletedAt),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getSetting() {
    return this.ensureSetting();
  }

  async updateSetting(input: AiSettingInput) {
    const row = await this.prisma.aiGenerationSetting.upsert({
      where: { id: 1 },
      update: input,
      create: { id: 1, ...input },
    });
    return this.settingDto(row);
  }

  async generate(admin: AuthUser) {
    const setting = await this.ensureSetting();
    return this.createFromModel(setting.prompt, admin.id);
  }

  private async tick() {
    const setting = await this.prisma.aiGenerationSetting.findUnique({ where: { id: 1 } });
    if (!setting?.enabled || setting.cadence === "manual") return;
    const wait = setting.cadence === "weekly" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    if (setting.lastRunAt && Date.now() - setting.lastRunAt.getTime() < wait) return;
    const admin = await this.prisma.user.findFirst({ where: { isAdmin: true } });
    if (!admin || !process.env.OPENAI_API_KEY) return;
    await this.createFromModel(setting.prompt, admin.id);
    await this.prisma.aiGenerationSetting.update({ where: { id: 1 }, data: { lastRunAt: new Date() } });
  }

  private async createFromModel(prompt: string, userId: string) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) apiError(HttpStatus.SERVICE_UNAVAILABLE, "AI_UNAVAILABLE", "OPENAI_API_KEY가 없습니다.");
    const categories = await this.prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `JSON만 반환. 형식 {"title": string, "categorySlug": string, "choices": string[]}. categorySlug는 ${categories.map((category) => category.slug).join(", ")} 중 하나.`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!response.ok) apiError(HttpStatus.BAD_GATEWAY, "AI_FAILED", "질문 생성에 실패했습니다.");
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content;
    if (!content) apiError(HttpStatus.BAD_GATEWAY, "AI_FAILED", "질문 생성에 실패했습니다.");
    let parsed: { title?: string; categorySlug?: string; choices?: string[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      apiError(HttpStatus.BAD_GATEWAY, "AI_INVALID", "생성된 질문 형식이 올바르지 않습니다.");
    }
    const category = categories.find((item) => item.slug === parsed.categorySlug) ?? categories.find((item) => item.slug === "daily");
    const choices = (parsed.choices ?? [])
      .map((choice) => choice.trim())
      .filter(Boolean)
      .slice(0, 4)
      .map((choice) => ({ content: choice.slice(0, 255) }));
    if (!parsed.title?.trim() || !category || choices.length < 2) {
      apiError(HttpStatus.BAD_GATEWAY, "AI_INVALID", "생성된 질문 형식이 올바르지 않습니다.");
    }
    const suggestion = await this.prisma.suggestedQuestion.create({
      data: {
        userId,
        title: parsed.title.trim().slice(0, 500),
        categoryId: category.id,
        choices,
        origin: "ai",
      },
      include: { category: true },
    });
    await this.prisma.aiGenerationSetting.update({ where: { id: 1 }, data: { lastRunAt: new Date() } });
    return this.suggestions.toDto(suggestion);
  }

  private async ensureSetting() {
    const existing = await this.prisma.aiGenerationSetting.findUnique({ where: { id: 1 } });
    if (existing) return this.settingDto(existing);
    const created = await this.prisma.aiGenerationSetting.create({
      data: { id: 1, enabled: false, cadence: "manual", prompt: DEFAULT_PROMPT },
    });
    return this.settingDto(created);
  }

  private settingDto(row: { enabled: boolean; cadence: string; prompt: string; lastRunAt: Date | null }) {
    return {
      enabled: row.enabled,
      cadence: row.cadence,
      prompt: row.prompt,
      lastRunAt: row.lastRunAt?.toISOString() ?? null,
    };
  }
}
