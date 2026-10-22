import { HttpException, HttpStatus } from "@nestjs/common";

export function apiError(status: HttpStatus, code: string, message: string): never {
  throw new HttpException({ code, message }, status);
}
