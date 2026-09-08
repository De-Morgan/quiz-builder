import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../../../database/generated/enums';

export class QuizDetailAnswerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'Paris' })
  text!: string;

  @ApiProperty({
    example: true,
    description: 'Only exposed to the quiz owner, never to public takers',
  })
  isCorrect!: boolean;
}

export class QuizDetailQuestionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'What is the capital of France?' })
  text!: string;

  @ApiProperty({ enum: QuestionType })
  type!: QuestionType;

  @ApiProperty({ type: [QuizDetailAnswerDto] })
  answers!: QuizDetailAnswerDto[];
}

export class QuizDetailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'General knowledge' })
  title!: string;

  @ApiProperty({ example: false })
  published!: boolean;

  @ApiProperty({ nullable: true, type: String, example: null })
  permalink!: string | null;

  @ApiProperty({ type: [QuizDetailQuestionDto] })
  questions!: QuizDetailQuestionDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
