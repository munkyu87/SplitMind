import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SuggestionsModule } from "../suggestions/suggestions.module";
import { MeController } from "./me.controller";

@Module({
  imports: [AuthModule, SuggestionsModule],
  controllers: [MeController],
})
export class MeModule {}
