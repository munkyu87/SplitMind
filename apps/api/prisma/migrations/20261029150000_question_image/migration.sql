ALTER TABLE "questions" ADD COLUMN "image_url" TEXT;
ALTER TABLE "suggested_questions" ADD COLUMN "image_url" TEXT;

UPDATE "questions" AS q
SET "image_url" = picked.image_url
FROM (
  SELECT DISTINCT ON (question_id) question_id, image_url
  FROM "question_choices"
  WHERE image_url IS NOT NULL
  ORDER BY question_id, choice_index
) AS picked
WHERE q.id = picked.question_id;
