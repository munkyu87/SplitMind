import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import { IS_ADMIN, IS_PUBLIC, AuthUser } from "./auth.guard";

export const Public = () => SetMetadata(IS_PUBLIC, true);
export const AdminOnly = () => SetMetadata(IS_ADMIN, true);

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});
