import { ApiProperty } from '@nestjs/swagger';

export class ScoreDto {
  @ApiProperty({
    example: 5,
    description: 'Number of questions answered correctly',
  })
  correct!: number;

  @ApiProperty({
    example: 8,
    description: 'Total number of questions on the quiz',
  })
  total!: number;
}
