import { HttpStatus, Injectable } from "@nestjs/common";
import { ChoiceInput, SuggestionInput } from "@splitmind/contract";
import { choiceInputSchema } from "@splitmind/contract";
import { z } from "zod";
import { AuthUser } from "../common/auth.guard";
import { apiError } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

const choiceListSchema = z.array(choiceInputSchema).min(2).max(4);

@Injectable()
export class SuggestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: SuggestionInput, user: AuthUser) {
    await this.ensureCategory(input.categoryId, user);
    const suggestion = await this.prisma.suggestedQuestion.create({
      data: {
        userId: user.id,
        title: input.title,
        categoryId: input.categoryId,
        choices: input.choices,
        origin: "user",
      },
      include: { category: true },
    });
    return this.toDto(suggestion);
  }

  async mine(user: AuthUser) {
    const rows = await this.prisma.suggestedQuestion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });
    return rows.map((row) => this.toDto(row));
  }

  async ensureCategory(categoryId: string, user: AuthUser) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) apiError(HttpStatus.BAD_REQUEST, "INVALID_CATEGORY", "카테고리를 찾을 수 없습니다.");
    if (category.requiresAdult && !user.isAdult) {
      apiError(HttpStatus.FORBIDDEN, "ADULT_ONLY", "성인 인증 후 제안할 수 있습니다.");
    }
    return category;
  }

  parseChoices(value: unknown): ChoiceInput[] {
    const parsed = choiceListSchema.safeParse(value);
    if (!parsed.success) apiError(HttpStatus.BAD_REQUEST, "INVALID_CHOICES", "선택지 형식이 올바르지 않습니다.");
    return parsed.data;
  }

  toDto(row: {
    id: string;
    title: string;
    status: "pending" | "approved" | "rejected";
    origin: "user" | "ai";
    choices: unknown;
    reviewReason: string | null;
    questionId: string | null;
    createdAt: Date;
    reviewedAt: Date | null;
    category: { id: string; name: string; slug: string; requiresAdult: boolean };
  }) {
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      origin: row.origin,
      choices: this.parseChoices(row.choices),
      reviewReason: row.reviewReason,
      questionId: row.questionId,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      category: {
        id: row.category.id,
        name: row.category.name,
        slug: row.category.slug,
        requiresAdult: row.category.requiresAdult,
      },
    };
  }
}
