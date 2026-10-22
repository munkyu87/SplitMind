import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./common/auth.guard";
import { CommentsModule } from "./comments/comments.module";
import { HealthController } from "./health.controller";
import { MeModule } from "./me/me.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QuestionsModule } from "./questions/questions.module";
import { SuggestionsModule } from "./suggestions/suggestions.module";

@Module({
  imports: [PrismaModule, AuthModule, QuestionsModule, CommentsModule, SuggestionsModule, MeModule, AdminModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
