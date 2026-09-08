import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({ example: 'b1d1e2f3-...' })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({ type: [String], example: ['a1b2c3d4-...'] })
  @IsArray()
  @IsString({ each: true })
  answerIds!: string[];
}

export class SubmitDto {
  @ApiProperty({ type: [SubmitAnswerDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers!: SubmitAnswerDto[];
}
