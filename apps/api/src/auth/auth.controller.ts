import { Body, Controller, Post } from "@nestjs/common";
import { devLoginSchema, refreshSchema, socialLoginSchema } from "@splitmind/contract";
import { Public } from "../common/decorators";
import { ZodPipe } from "../common/zod.pipe";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("social")
  social(@Body(new ZodPipe(socialLoginSchema)) body: ReturnType<typeof socialLoginSchema.parse>) {
    return this.auth.socialLogin(body);
  }

  @Public()
  @Post("dev")
  dev(@Body(new ZodPipe(devLoginSchema)) body: ReturnType<typeof devLoginSchema.parse>) {
    return this.auth.devLogin(body);
  }

  @Public()
  @Post("refresh")
  refresh(@Body(new ZodPipe(refreshSchema)) body: ReturnType<typeof refreshSchema.parse>) {
    return this.auth.refresh(body.refreshToken);
  }

  @Public()
  @Post("logout")
  logout(@Body(new ZodPipe(refreshSchema)) body: ReturnType<typeof refreshSchema.parse>) {
    return this.auth.logout(body.refreshToken);
  }
}
