import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../../../database/generated/enums';

export class PublicAnswerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'Paris' })
  text!: string;
}

export class PublicQuestionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'What is the capital of France?' })
  text!: string;

  @ApiProperty({ enum: QuestionType })
  type!: QuestionType;

  @ApiProperty({ type: [PublicAnswerDto] })
  answers!: PublicAnswerDto[];
}

export class PublicQuizDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'General knowledge' })
  title!: string;

  @ApiProperty({ type: [PublicQuestionDto] })
  questions!: PublicQuestionDto[];
}
