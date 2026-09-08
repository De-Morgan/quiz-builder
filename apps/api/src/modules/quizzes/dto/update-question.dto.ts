import { PartialType } from '@nestjs/swagger';
import { QuestionDto } from './question.dto';

/**
 * `PATCH /quizzes/:id/questions/:questionId` — any subset of `text`, `type`,
 * `answers`. Omitted fields are left untouched; when `answers` is present it is
 * a full replace of that question's answers (2–5).
 */
export class UpdateQuestionDto extends PartialType(QuestionDto) {}
