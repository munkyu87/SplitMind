import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { aiSettingSchema, rejectSchema } from "@splitmind/contract";
import { AuthUser } from "../common/auth.guard";
import { AdminOnly, CurrentUser } from "../common/decorators";
import { ZodPipe } from "../common/zod.pipe";
import { AdminService } from "./admin.service";

@AdminOnly()
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("suggestions")
  pending() {
    return this.admin.pending();
  }

  @Post("suggestions/:id/approve")
  approve(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.admin.approve(id, user);
  }

  @Post("suggestions/:id/reject")
  reject(
    @Param("id") id: string,
    @Body(new ZodPipe(rejectSchema)) body: ReturnType<typeof rejectSchema.parse>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.admin.reject(id, body, user);
  }

  @Post("questions/:id/archive")
  archive(@Param("id") id: string) {
    return this.admin.archive(id);
  }

  @Get("reports")
  reports() {
    return this.admin.reports();
  }

  @Get("ai/settings")
  aiSettings() {
    return this.admin.getSetting();
  }

  @Put("ai/settings")
  updateAi(
    @Body(new ZodPipe(aiSettingSchema)) body: ReturnType<typeof aiSettingSchema.parse>,
  ) {
    return this.admin.updateSetting(body);
  }

  @Post("ai/generate")
  generate(@CurrentUser() user: AuthUser) {
    return this.admin.generate(user);
  }
}
