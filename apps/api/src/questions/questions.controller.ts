import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { answerSchema, listQuerySchema, ratingSchema } from "@splitmind/contract";
import { AuthUser } from "../common/auth.guard";
import { CurrentUser } from "../common/decorators";
import { ZodPipe } from "../common/zod.pipe";
import { QuestionsService } from "./questions.service";

@Controller()
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Get("categories")
  categories(@CurrentUser() user: AuthUser) {
    return this.questions.categories(user);
  }

  @Get("questions")
  list(@Query(new ZodPipe(listQuerySchema)) query: ReturnType<typeof listQuerySchema.parse>, @CurrentUser() user: AuthUser) {
    return this.questions.list(query, user);
  }

  @Get("questions/:id")
  detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.questions.detail(id, user);
  }

  @Post("questions/:id/answers")
  answer(
    @Param("id") id: string,
    @Body(new ZodPipe(answerSchema)) body: ReturnType<typeof answerSchema.parse>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.questions.answer(id, body, user);
  }

  @Get("questions/:id/results")
  results(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.questions.results(id, user);
  }

  @Put("questions/:id/rating")
  rate(
    @Param("id") id: string,
    @Body(new ZodPipe(ratingSchema)) body: ReturnType<typeof ratingSchema.parse>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.questions.rate(id, body, user);
  }
}
