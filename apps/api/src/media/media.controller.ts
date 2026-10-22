import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { randomUUID } from "crypto";
import { createReadStream, existsSync, mkdirSync } from "fs";
import { diskStorage } from "multer";
import { extname, join } from "path";
import type { Response } from "express";
import { Public } from "../common/decorators";
import { apiError } from "../common/http";
import { HttpStatus } from "@nestjs/common";

export const uploadRoot = join(process.cwd(), "uploads");

const types = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

@Controller("media")
export class MediaController {
  @Public()
  @Get(":name")
  file(@Param("name") name: string, @Res() res: Response) {
    if (!/^[\w.-]+$/.test(name)) apiError(HttpStatus.BAD_REQUEST, "INVALID_MEDIA", "파일을 찾을 수 없습니다.");
    const path = join(uploadRoot, name);
    if (!existsSync(path)) apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "파일을 찾을 수 없습니다.");
    const type = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
    res.setHeader("Content-Type", type);
    createReadStream(path).pipe(res);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024 },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(uploadRoot, { recursive: true });
          cb(null, uploadRoot);
        },
        filename: (_req, file, cb) => {
          const ext = types.get(file.mimetype);
          cb(null, `${randomUUID()}${ext ?? ""}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!types.has(file.mimetype)) {
          cb(new Error("이미지는 jpg, png, webp만 올릴 수 있습니다."), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) apiError(HttpStatus.BAD_REQUEST, "INVALID_MEDIA", "이미지 파일을 첨부해 주세요.");
    if (extname(file.filename) === "") apiError(HttpStatus.BAD_REQUEST, "INVALID_MEDIA", "이미지는 jpg, png, webp만 올릴 수 있습니다.");
    return { path: `/v1/media/${file.filename}` };
  }
}
