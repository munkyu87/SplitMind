import { HttpStatus, Injectable } from "@nestjs/common";
import { CommentInput, ListQuery, ReportInput } from "@splitmind/contract";
import { AuthUser } from "../common/auth.guard";
import { decodeOffset, encodeOffset } from "../common/ids";
import { apiError } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";
import { QuestionsService } from "../questions/questions.service";

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questions: QuestionsService,
  ) {}

  async list(questionId: string, query: Pick<ListQuery, "cursor" | "limit">, user: AuthUser) {
    await this.questions.requireAnswered(questionId, user);
    const offset = decodeOffset(query.cursor);
    if (offset < 0) apiError(HttpStatus.BAD_REQUEST, "INVALID_CURSOR", "커서가 올바르지 않습니다.");
    const rows = await this.prisma.comment.findMany({
      where: { questionId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: query.limit,
      include: {
        user: { select: { nickname: true } },
        _count: { select: { likes: true } },
        likes: { where: { userId: user.id }, select: { id: true } },
        reports: { where: { userId: user.id }, select: { reason: true } },
      },
    });
    return {
      items: rows.map((row) => this.toDto(row)),
      nextCursor: rows.length === query.limit ? encodeOffset(offset + rows.length) : null,
    };
  }

  async create(questionId: string, input: CommentInput, user: AuthUser) {
    const question = await this.questions.requireAnswered(questionId, user);
    if (input.choiceIndex != null && !question.choices.some((choice) => choice.choiceIndex === input.choiceIndex)) {
      apiError(HttpStatus.BAD_REQUEST, "INVALID_CHOICE", "선택지가 올바르지 않습니다.");
    }
    const row = await this.prisma.comment.create({
      data: {
        questionId,
        userId: user.id,
        content: input.content,
        choiceIndex: input.choiceIndex,
      },
      include: {
        user: { select: { nickname: true } },
        _count: { select: { likes: true } },
        likes: { where: { userId: user.id }, select: { id: true } },
        reports: { where: { userId: user.id }, select: { reason: true } },
      },
    });
    return this.toDto(row);
  }

  async remove(id: string, user: AuthUser) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.deletedAt) apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "댓글을 찾을 수 없습니다.");
    if (comment.userId !== user.id && !user.isAdmin) {
      apiError(HttpStatus.FORBIDDEN, "FORBIDDEN", "댓글을 삭제할 수 없습니다.");
    }
    await this.prisma.comment.update({ where: { id }, data: { deletedAt: new Date() } });
    return { ok: true };
  }

  async like(id: string, user: AuthUser) {
    const comment = await this.visible(id, user);
    await this.prisma.commentLike.upsert({
      where: { commentId_userId: { commentId: id, userId: user.id } },
      update: {},
      create: { commentId: id, userId: user.id },
    });
    return this.reload(comment.id, comment.questionId, user.id);
  }

  async unlike(id: string, user: AuthUser) {
    const comment = await this.visible(id, user);
    await this.prisma.commentLike.deleteMany({ where: { commentId: id, userId: user.id } });
    return this.reload(comment.id, comment.questionId, user.id);
  }

  async report(id: string, input: ReportInput, user: AuthUser) {
    await this.visible(id, user);
    try {
      await this.prisma.commentReport.create({
        data: { commentId: id, userId: user.id, reason: input.reason },
      });
    } catch {
      apiError(HttpStatus.CONFLICT, "ALREADY_REPORTED", "이미 신고한 댓글입니다.");
    }
    return { ok: true };
  }

  async withdrawReport(id: string, user: AuthUser) {
    await this.visible(id, user);
    await this.prisma.commentReport.deleteMany({ where: { commentId: id, userId: user.id } });
    return { ok: true };
  }

  private async visible(id: string, user: AuthUser) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.deletedAt) apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "댓글을 찾을 수 없습니다.");
    await this.questions.requireAnswered(comment.questionId, user);
    return comment;
  }

  private async reload(id: string, questionId: string, userId: string) {
    const row = await this.prisma.comment.findUniqueOrThrow({
      where: { id },
      include: {
        user: { select: { nickname: true } },
        _count: { select: { likes: true } },
        likes: { where: { userId }, select: { id: true } },
        reports: { where: { userId }, select: { reason: true } },
      },
    });
    return this.toDto(row);
  }

  private toDto(row: {
    id: string;
    content: string;
    choiceIndex: number | null;
    createdAt: Date;
    user: { nickname: string | null };
    _count: { likes: number };
    likes: { id: string }[];
    reports: { reason: string }[];
  }) {
    return {
      id: row.id,
      nickname: row.user.nickname ?? "이름 없음",
      content: row.content,
      choiceIndex: row.choiceIndex,
      likeCount: row._count.likes,
      likedByMe: row.likes.length > 0,
      reportedByMe: row.reports.length > 0,
      reportReason: row.reports[0]?.reason ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
