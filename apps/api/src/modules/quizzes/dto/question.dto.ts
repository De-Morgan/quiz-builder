import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { QuestionType } from '../../../database/generated/enums';
import { AnswerDto } from './answer.dto';

export class QuestionDto {
  @ApiProperty({ example: 'What is the capital of France?' })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiProperty({ enum: QuestionType, example: QuestionType.SINGLE })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiProperty({ type: [AnswerDto], minItems: 2, maxItems: 5 })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];
}
