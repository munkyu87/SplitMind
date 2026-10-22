import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { ZodTypeAny } from "zod";

@Injectable()
export class ZodPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "요청 값이 올바르지 않습니다.";
      throw new BadRequestException({ code: "INVALID_INPUT", message });
    }
    return parsed.data;
  }
}
