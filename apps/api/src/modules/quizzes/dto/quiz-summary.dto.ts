import { ApiProperty } from '@nestjs/swagger';

export class QuizSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'General knowledge' })
  title!: string;

  @ApiProperty({ example: false })
  published!: boolean;

  @ApiProperty({ nullable: true, example: null, type: String })
  permalink!: string | null;

  @ApiProperty({ example: 3, description: 'Number of questions in the quiz' })
  questionCount!: number;
}
