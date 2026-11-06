ALTER TABLE "comments" ADD COLUMN "parent_id" UUID;
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");
