import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { commentSchema, listQuerySchema, reportSchema } from "@splitmind/contract";
import { AuthUser } from "../common/auth.guard";
import { CurrentUser } from "../common/decorators";
import { ZodPipe } from "../common/zod.pipe";
import { CommentsService } from "./comments.service";

@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get("questions/:questionId/comments")
  list(
    @Param("questionId") questionId: string,
    @Query(new ZodPipe(listQuerySchema)) query: ReturnType<typeof listQuerySchema.parse>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.list(questionId, query, user);
  }

  @Post("questions/:questionId/comments")
  create(
    @Param("questionId") questionId: string,
    @Body(new ZodPipe(commentSchema)) body: ReturnType<typeof commentSchema.parse>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.create(questionId, body, user);
  }

  @Delete("comments/:id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.comments.remove(id, user);
  }

  @Post("comments/:id/likes")
  like(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.comments.like(id, user);
  }

  @Delete("comments/:id/likes")
  unlike(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.comments.unlike(id, user);
  }

  @Post("comments/:id/reports")
  report(
    @Param("id") id: string,
    @Body(new ZodPipe(reportSchema)) body: ReturnType<typeof reportSchema.parse>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.report(id, body, user);
  }
}
