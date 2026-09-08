import { PartialType } from '@nestjs/swagger';
import { CreateQuizDto } from './create-quiz.dto';

/**
 * `PATCH /quizzes/:id` is a partial update: send `title`, `questions`, or both.
 * A field that is omitted is left untouched; when `questions` is present it is a
 * full-array replace of the question set (validated by `validateQuizInvariants`).
 */
export class UpdateQuizDto extends PartialType(CreateQuizDto) {}
