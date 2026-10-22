import { Body, Controller, Post } from "@nestjs/common";
import { suggestionSchema } from "@splitmind/contract";
import { AuthUser } from "../common/auth.guard";
import { CurrentUser } from "../common/decorators";
import { ZodPipe } from "../common/zod.pipe";
import { SuggestionsService } from "./suggestions.service";

@Controller("suggestions")
export class SuggestionsController {
  constructor(private readonly suggestions: SuggestionsService) {}

  @Post()
  create(
    @Body(new ZodPipe(suggestionSchema)) body: ReturnType<typeof suggestionSchema.parse>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.suggestions.create(body, user);
  }
}
