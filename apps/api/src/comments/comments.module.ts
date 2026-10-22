import { Module } from "@nestjs/common";
import { QuestionsModule } from "../questions/questions.module";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";

@Module({
  imports: [QuestionsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
