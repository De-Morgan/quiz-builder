import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PublicQuizDto } from './dto/public-quiz.dto';
import { ScoreDto } from './dto/score.dto';
import { SubmitDto } from './dto/submit.dto';
import { PublicService } from './public.service';

@ApiTags('public')
@Controller('public/quizzes')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get(':permalink')
  @ApiOperation({
    summary: 'Fetch a published quiz to take (no correct answers)',
  })
  @ApiOkResponse({ type: PublicQuizDto })
  @ApiNotFoundResponse({
    description: 'Permalink unknown or quiz not published',
  })
  getByPermalink(
    @Param('permalink') permalink: string,
  ): Promise<PublicQuizDto> {
    return this.publicService.getByPermalink(permalink);
  }

  @Post(':permalink/submit')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Submit answers and get a score (nothing persisted)',
  })
  @ApiOkResponse({ type: ScoreDto })
  @ApiBadRequestResponse({ description: 'Malformed submission' })
  @ApiNotFoundResponse({
    description: 'Permalink unknown or quiz not published',
  })
  submit(
    @Param('permalink') permalink: string,
    @Body() dto: SubmitDto,
  ): Promise<ScoreDto> {
    return this.publicService.submit(permalink, dto);
  }
}
