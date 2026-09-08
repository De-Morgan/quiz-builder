import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { QuestionType } from '../../database/generated/enums';
import { PublicQuizDto } from './dto/public-quiz.dto';
import { ScoreDto } from './dto/score.dto';
import { SubmitDto } from './dto/submit.dto';
import { ScoringService } from './scoring.service';

const questionsInclude = {
  questions: {
    orderBy: { order: 'asc' as const },
    include: { answers: { orderBy: { order: 'asc' as const } } },
  },
};

interface LoadedQuiz {
  id: string;
  title: string;
  questions: {
    id: string;
    text: string;
    type: QuestionType;
    answers: { id: string; text: string; isCorrect: boolean }[];
  }[];
}

@Injectable()
export class PublicService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly scoringService: ScoringService,
  ) {}

  async getByPermalink(permalink: string): Promise<PublicQuizDto> {
    const quiz = await this.getPublishedQuizOrThrow(permalink);
    return this.toPublicDto(quiz);
  }

  async submit(permalink: string, dto: SubmitDto): Promise<ScoreDto> {
    const quiz = await this.getPublishedQuizOrThrow(permalink);
    return this.scoringService.score(quiz, dto);
  }

  private async getPublishedQuizOrThrow(
    permalink: string,
  ): Promise<LoadedQuiz> {
    const quiz = await this.databaseService.quiz.findFirst({
      where: { permalink, published: true },
      include: questionsInclude,
    });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }

  private toPublicDto(quiz: LoadedQuiz): PublicQuizDto {
    return {
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions.map((question) => ({
        id: question.id,
        text: question.text,
        type: question.type,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          text: answer.text,
        })),
      })),
    };
  }
}
