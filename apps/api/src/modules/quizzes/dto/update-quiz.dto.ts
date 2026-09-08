import { CreateQuizDto } from './create-quiz.dto';

/**
 * `PATCH /quizzes/:id` performs a full replace of the quiz title and questions,
 * so the payload shape is identical to {@link CreateQuizDto}.
 */
export class UpdateQuizDto extends CreateQuizDto {}
