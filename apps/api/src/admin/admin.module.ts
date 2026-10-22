import { Module } from "@nestjs/common";
import { SuggestionsModule } from "../suggestions/suggestions.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [SuggestionsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
