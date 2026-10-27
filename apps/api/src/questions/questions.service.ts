import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AnswerInput, ListQuery, RatingInput } from "@splitmind/contract";
import { AuthUser } from "../common/auth.guard";
import { decodeOffset, encodeOffset } from "../common/ids";
import { apiError } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQuery, user: AuthUser) {
    const offset = decodeOffset(query.cursor);
    if (offset < 0) apiError(HttpStatus.BAD_REQUEST, "INVALID_CURSOR", "커서가 올바르지 않습니다.");

    const ids =
      query.sort === "latest"
        ? await this.latestIds(query, user, offset)
        : await this.rankedIds(query, user, offset);

    const items = await this.hydrate(ids, user.id);
    const nextCursor = ids.length === query.limit ? encodeOffset(offset + ids.length) : null;
    return { items, nextCursor };
  }

  async categories(user: AuthUser) {
    return this.prisma.category.findMany({
      where: user.isAdult ? {} : { requiresAdult: false },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, requiresAdult: true },
    });
  }

  async detail(id: string, user: AuthUser) {
    const question = await this.loadReadable(id, user);
    const answer = await this.prisma.userAnswer.findUnique({
      where: { userId_questionId: { userId: user.id, questionId: id } },
    });
    return {
      id: question.id,
      title: question.title,
      source: question.source,
      publishedAt: question.publishedAt?.toISOString() ?? null,
      categories: question.categories.map((row) => ({
        id: row.category.id,
        name: row.category.name,
        slug: row.category.slug,
        requiresAdult: row.category.requiresAdult,
      })),
      choices: question.choices.map((choice) => ({
        choiceIndex: choice.choiceIndex,
        content: choice.content,
        imageUrl: choice.imageUrl,
      })),
      answered: Boolean(answer),
      myChoiceIndex: answer?.choiceIndex ?? null,
    };
  }

  async answer(id: string, input: AnswerInput, user: AuthUser) {
    const question = await this.loadReadable(id, user);
    if (!question.choices.some((choice) => choice.choiceIndex === input.choiceIndex)) {
      apiError(HttpStatus.BAD_REQUEST, "INVALID_CHOICE", "선택지가 올바르지 않습니다.");
    }
    try {
      await this.prisma.userAnswer.create({
        data: { userId: user.id, questionId: id, choiceIndex: input.choiceIndex },
      });
    } catch {
      apiError(HttpStatus.CONFLICT, "ALREADY_ANSWERED", "이미 참여한 질문입니다.");
    }
    return this.results(id, user);
  }

  async results(id: string, user: AuthUser) {
    await this.requireAnswered(id, user);
    const [choices, grouped, mine, rating] = await Promise.all([
      this.prisma.questionChoice.findMany({ where: { questionId: id }, orderBy: { choiceIndex: "asc" } }),
      this.prisma.userAnswer.groupBy({
        by: ["choiceIndex"],
        where: { questionId: id },
        _count: { _all: true },
      }),
      this.prisma.userAnswer.findUnique({ where: { userId_questionId: { userId: user.id, questionId: id } } }),
      this.prisma.questionRating.findUnique({ where: { questionId_userId: { questionId: id, userId: user.id } } }),
    ]);
    const counts = new Map(grouped.map((row) => [row.choiceIndex, row._count._all]));
    const total = grouped.reduce((sum, row) => sum + row._count._all, 0);
    return {
      questionId: id,
      total,
      myChoiceIndex: mine?.choiceIndex ?? null,
      myRating: rating ? Number(rating.rating) : null,
      choices: choices.map((choice) => {
        const count = counts.get(choice.choiceIndex) ?? 0;
        return {
          choiceIndex: choice.choiceIndex,
          content: choice.content,
          imageUrl: choice.imageUrl,
          count,
          ratio: total === 0 ? 0 : Number((count / total).toFixed(4)),
        };
      }),
    };
  }

  async rate(id: string, input: RatingInput, user: AuthUser) {
    await this.requireAnswered(id, user);
    const rating = await this.prisma.questionRating.upsert({
      where: { questionId_userId: { questionId: id, userId: user.id } },
      update: { rating: input.rating },
      create: { questionId: id, userId: user.id, rating: input.rating },
    });
    return { questionId: id, rating: Number(rating.rating) };
  }

  async requireAnswered(id: string, user: AuthUser) {
    const question = await this.loadReadable(id, user);
    const answer = await this.prisma.userAnswer.findUnique({
      where: { userId_questionId: { userId: user.id, questionId: id } },
    });
    if (!answer) apiError(HttpStatus.FORBIDDEN, "NOT_ANSWERED", "참여한 뒤에 볼 수 있습니다.");
    return question;
  }

  async loadReadable(id: string, user: AuthUser) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        choices: { orderBy: { choiceIndex: "asc" } },
        categories: { include: { category: true } },
      },
    });
    if (!question || question.status !== "published") {
      apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "질문을 찾을 수 없습니다.");
    }
    if (!user.isAdult && question.categories.some((row) => row.category.requiresAdult)) {
      apiError(HttpStatus.FORBIDDEN, "ADULT_ONLY", "성인 인증이 필요한 질문입니다.");
    }
    return question;
  }

  private async latestIds(query: ListQuery, user: AuthUser, offset: number) {
    const rows = await this.prisma.question.findMany({
      where: this.where(query, user),
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      skip: offset,
      take: query.limit,
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  private async rankedIds(query: ListQuery, user: AuthUser, offset: number) {
    const where = this.sqlFilter(query, user);
    const order =
      query.sort === "popular"
        ? Prisma.sql`votes DESC, q.published_at DESC`
        : query.sort === "rating"
          ? Prisma.sql`avg_rating DESC NULLS LAST, rating_count DESC, q.published_at DESC`
          : Prisma.sql`balance DESC, q.published_at DESC`;

    const balanceJoin =
      query.sort === "balance"
        ? Prisma.sql`
          JOIN (
            SELECT question_id, COUNT(*)::float AS total
            FROM user_answers
            GROUP BY question_id
            HAVING COUNT(*) >= 30
          ) totals ON totals.question_id = q.id
          JOIN question_choices qc ON qc.question_id = q.id
          JOIN (
            SELECT question_id, COUNT(*)::float AS n FROM question_choices GROUP BY question_id
          ) choice_n ON choice_n.question_id = q.id
          LEFT JOIN (
            SELECT question_id, choice_index, COUNT(*)::float AS cnt
            FROM user_answers
            GROUP BY question_id, choice_index
          ) counts ON counts.question_id = q.id AND counts.choice_index = qc.choice_index
        `
        : Prisma.sql``;

    const select =
      query.sort === "popular"
        ? Prisma.sql`q.id, COUNT(a.id)::int AS votes`
        : query.sort === "rating"
          ? Prisma.sql`q.id, AVG(r.rating) AS avg_rating, COUNT(r.id)::int AS rating_count`
          : Prisma.sql`q.id, 1 - MAX(ABS(COALESCE(counts.cnt, 0) / totals.total - 1.0 / choice_n.n)) AS balance`;

    const joins =
      query.sort === "popular"
        ? Prisma.sql`LEFT JOIN user_answers a ON a.question_id = q.id`
        : query.sort === "rating"
          ? Prisma.sql`LEFT JOIN question_ratings r ON r.question_id = q.id`
          : balanceJoin;

    const having = query.sort === "rating" ? Prisma.sql`HAVING COUNT(r.id) >= 5` : Prisma.empty;
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT ${select}
      FROM questions q
      ${joins}
      WHERE ${where}
      GROUP BY q.id, q.published_at
      ${having}
      ORDER BY ${order}
      LIMIT ${query.limit} OFFSET ${offset}
    `;
    return rows.map((row) => row.id);
  }

  private where(query: ListQuery, user: AuthUser): Prisma.QuestionWhereInput {
    return {
      status: "published",
      ...(query.q ? { title: { contains: query.q, mode: "insensitive" } } : {}),
      ...(query.unanswered ? { answers: { none: { userId: user.id } } } : {}),
      ...(query.answered ? { answers: { some: { userId: user.id } } } : {}),
      AND: [
        ...(query.category ? [{ categories: { some: { category: { slug: query.category } } } }] : []),
        ...(!user.isAdult ? [{ categories: { none: { category: { requiresAdult: true } } } }] : []),
      ],
    };
  }

  private sqlFilter(query: ListQuery, user: AuthUser) {
    const parts: Prisma.Sql[] = [Prisma.sql`q.status = 'published'`];
    if (query.q) parts.push(Prisma.sql`q.title ILIKE ${`%${query.q}%`}`);
    if (query.category) {
      parts.push(Prisma.sql`EXISTS (
        SELECT 1 FROM question_category_map m
        JOIN categories c ON c.id = m.category_id
        WHERE m.question_id = q.id AND c.slug = ${query.category}
      )`);
    }
    if (!user.isAdult) {
      parts.push(Prisma.sql`NOT EXISTS (
        SELECT 1 FROM question_category_map m
        JOIN categories c ON c.id = m.category_id
        WHERE m.question_id = q.id AND c.requires_adult = true
      )`);
    }
    if (query.unanswered) {
      parts.push(Prisma.sql`NOT EXISTS (
        SELECT 1 FROM user_answers ua
        WHERE ua.question_id = q.id AND ua.user_id = ${user.id}::uuid
      )`);
    }
    if (query.answered) {
      parts.push(Prisma.sql`EXISTS (
        SELECT 1 FROM user_answers ua
        WHERE ua.question_id = q.id AND ua.user_id = ${user.id}::uuid
      )`);
    }
    return Prisma.join(parts, " AND ");
  }

  private async hydrate(ids: string[], userId: string) {
    if (ids.length === 0) return [];
    const [questions, ratings, mine] = await Promise.all([
      this.prisma.question.findMany({
        where: { id: { in: ids } },
        include: {
          categories: { include: { category: true } },
          _count: { select: { answers: true } },
        },
      }),
      this.prisma.questionRating.groupBy({
        by: ["questionId"],
        where: { questionId: { in: ids } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.userAnswer.findMany({
        where: { userId, questionId: { in: ids } },
        select: { questionId: true },
      }),
    ]);
    const ratingMap = new Map(ratings.map((row) => [row.questionId, row]));
    const answered = new Set(mine.map((row) => row.questionId));
    const byId = new Map(questions.map((question) => [question.id, question]));
    return ids.flatMap((id) => {
      const question = byId.get(id);
      if (!question) return [];
      const rating = ratingMap.get(id);
      return [
        {
          id: question.id,
          title: question.title,
          source: question.source,
          publishedAt: question.publishedAt?.toISOString() ?? null,
          participantCount: question._count.answers,
          averageRating: rating?._avg.rating == null ? null : Number(rating._avg.rating),
          ratingCount: rating?._count.rating ?? 0,
          categories: question.categories.map((row) => ({
            id: row.category.id,
            name: row.category.name,
            slug: row.category.slug,
            requiresAdult: row.category.requiresAdult,
          })),
          answered: answered.has(id),
        },
      ];
    });
  }
}
