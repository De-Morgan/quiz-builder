import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuestionDto } from './dto/question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizDetailDto } from './dto/quiz-detail.dto';
import { QuizSummaryDto } from './dto/quiz-summary.dto';

@ApiTags('quizzes')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a quiz' })
  @ApiCreatedResponse({ type: QuizDetailDto })
  @ApiBadRequestResponse({ description: 'Validation or invariant failure' })
  create(
    @CurrentUser() user: UserDto,
    @Body() dto: CreateQuizDto,
  ): Promise<QuizDetailDto> {
    return this.quizzesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List the current user's quizzes" })
  @ApiOkResponse({ type: [QuizSummaryDto] })
  findAll(@CurrentUser() user: UserDto): Promise<QuizSummaryDto[]> {
    return this.quizzesService.findAllForOwner(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of the current user’s quizzes' })
  @ApiOkResponse({ type: QuizDetailDto })
  @ApiNotFoundResponse({ description: 'Quiz not found or not owned' })
  findOne(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<QuizDetailDto> {
    return this.quizzesService.findOneForOwner(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quiz title and/or questions' })
  @ApiOkResponse({ type: QuizDetailDto })
  @ApiBadRequestResponse({
    description: 'Validation or invariant failure, or an empty body',
  })
  @ApiNotFoundResponse({ description: 'Quiz not found or not owned' })
  @ApiConflictResponse({
    description: 'Quiz is published and cannot be edited',
  })
  update(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
  ): Promise<QuizDetailDto> {
    return this.quizzesService.update(id, user.id, dto);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Append a question to a draft quiz' })
  @ApiCreatedResponse({ type: QuizDetailDto })
  @ApiBadRequestResponse({
    description: 'Invariant failure, duplicate text, or the 10-question limit',
  })
  @ApiNotFoundResponse({ description: 'Quiz not found or not owned' })
  @ApiConflictResponse({
    description: 'Quiz is published and cannot be edited',
  })
  addQuestion(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() dto: QuestionDto,
  ): Promise<QuizDetailDto> {
    return this.quizzesService.addQuestion(id, user.id, dto);
  }

  @Patch(':id/questions/:questionId')
  @ApiOperation({ summary: 'Partially update a question on a draft quiz' })
  @ApiOkResponse({ type: QuizDetailDto })
  @ApiBadRequestResponse({
    description: 'Invariant failure, duplicate text, or an empty body',
  })
  @ApiNotFoundResponse({
    description: 'Quiz or question not found or not owned',
  })
  @ApiConflictResponse({
    description: 'Quiz is published and cannot be edited',
  })
  updateQuestion(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<QuizDetailDto> {
    return this.quizzesService.updateQuestion(id, user.id, questionId, dto);
  }

  @Delete(':id/questions/:questionId')
  @ApiOperation({ summary: 'Remove a question from a draft quiz' })
  @ApiOkResponse({ type: QuizDetailDto })
  @ApiBadRequestResponse({ description: 'Cannot remove the last question' })
  @ApiNotFoundResponse({
    description: 'Quiz or question not found or not owned',
  })
  @ApiConflictResponse({
    description: 'Quiz is published and cannot be edited',
  })
  removeQuestion(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ): Promise<QuizDetailDto> {
    return this.quizzesService.removeQuestion(id, user.id, questionId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a quiz (published or not)' })
  @ApiNoContentResponse({ description: 'Quiz deleted' })
  @ApiNotFoundResponse({ description: 'Quiz not found or not owned' })
  remove(@CurrentUser() user: UserDto, @Param('id') id: string): Promise<void> {
    return this.quizzesService.remove(id, user.id);
  }

  @Post(':id/publish')
  @HttpCode(200)
  @ApiOperation({ summary: 'Publish a quiz and assign a permalink' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        permalink: { type: 'string', example: 'aB3xY9' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Quiz not found or not owned' })
  @ApiConflictResponse({ description: 'Quiz is already published' })
  publish(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<{ id: string; permalink: string }> {
    return this.quizzesService.publish(id, user.id);
  }
}
