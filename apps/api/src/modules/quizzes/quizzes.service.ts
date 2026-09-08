import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Prisma } from '../../database/generated/client';
import { QuestionType } from '../../database/generated/enums';
import { generatePermalink } from '../../common/permalink';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuestionDto } from './dto/question.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizDetailDto } from './dto/quiz-detail.dto';
import { QuizSummaryDto } from './dto/quiz-summary.dto';

const MAX_QUESTIONS = 10;

const questionsInclude = {
  questions: {
    orderBy: { order: 'asc' as const },
    include: { answers: { orderBy: { order: 'asc' as const } } },
  },
};

const normalize = (text: string): string => text.trim().toLowerCase();

@Injectable()
export class QuizzesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(ownerId: string, dto: CreateQuizDto): Promise<QuizDetailDto> {
    this.validateQuizInvariants(dto.questions);

    const quiz = await this.databaseService.quiz.create({
      data: {
        title: dto.title,
        ownerId,
        questions: { create: this.buildQuestionsCreate(dto.questions) },
      },
      include: questionsInclude,
    });

    return this.toDetailDto(quiz);
  }

  async findAllForOwner(ownerId: string): Promise<QuizSummaryDto[]> {
    const quizzes = await this.databaseService.quiz.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } } },
    });

    return quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      published: quiz.published,
      permalink: quiz.permalink,
      questionCount: quiz._count.questions,
    }));
  }

  async findOneForOwner(id: string, ownerId: string): Promise<QuizDetailDto> {
    const quiz = await this.getOwnedQuizOrThrow(id, ownerId);
    return this.toDetailDto(quiz);
  }

  async update(
    id: string,
    ownerId: string,
    dto: UpdateQuizDto,
  ): Promise<QuizDetailDto> {
    const quiz = await this.getOwnedQuizOrThrow(id, ownerId);
    if (quiz.published) {
      throw new ConflictException('A published quiz cannot be edited');
    }
    if (dto.title === undefined && dto.questions === undefined) {
      throw new BadRequestException('Provide a title or questions to update');
    }

    if (dto.questions !== undefined) {
      this.validateQuizInvariants(dto.questions);
      await this.databaseService.$transaction([
        this.databaseService.question.deleteMany({ where: { quizId: id } }),
        this.databaseService.quiz.update({
          where: { id },
          data: {
            ...(dto.title !== undefined ? { title: dto.title } : {}),
            questions: { create: this.buildQuestionsCreate(dto.questions) },
          },
        }),
      ]);
    } else {
      await this.databaseService.quiz.update({
        where: { id },
        data: { title: dto.title },
      });
    }

    const updated = await this.databaseService.quiz.findUniqueOrThrow({
      where: { id },
      include: questionsInclude,
    });
    return this.toDetailDto(updated);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.getOwnedQuizOrThrow(id, ownerId);
    await this.databaseService.quiz.delete({ where: { id } });
  }

  async addQuestion(
    id: string,
    ownerId: string,
    dto: QuestionDto,
  ): Promise<QuizDetailDto> {
    const quiz = await this.getOwnedQuizOrThrow(id, ownerId);
    if (quiz.published) {
      throw new ConflictException(
        'A published quiz cannot have its questions changed',
      );
    }
    if (quiz.questions.length >= MAX_QUESTIONS) {
      throw new BadRequestException(
        `A quiz cannot have more than ${MAX_QUESTIONS} questions`,
      );
    }
    this.validateQuizInvariants([dto]);
    const existing = new Set(quiz.questions.map((q) => normalize(q.text)));
    if (existing.has(normalize(dto.text))) {
      throw new BadRequestException(
        'Quiz already has a question with that text',
      );
    }

    await this.runUniqueWrite(
      () =>
        this.databaseService.question.create({
          data: {
            quizId: id,
            ...this.buildOneQuestionCreate(dto, quiz.questions.length),
          },
        }),
      'Quiz already has a question with that text',
    );

    const updated = await this.databaseService.quiz.findUniqueOrThrow({
      where: { id },
      include: questionsInclude,
    });
    return this.toDetailDto(updated);
  }

  async removeQuestion(
    id: string,
    ownerId: string,
    questionId: string,
  ): Promise<QuizDetailDto> {
    const quiz = await this.getOwnedQuizOrThrow(id, ownerId);
    if (quiz.published) {
      throw new ConflictException(
        'A published quiz cannot have its questions changed',
      );
    }
    if (!quiz.questions.some((q) => q.id === questionId)) {
      throw new NotFoundException('Question not found');
    }
    if (quiz.questions.length <= 1) {
      throw new BadRequestException('A quiz must keep at least one question');
    }

    await this.databaseService.question.delete({ where: { id: questionId } });

    const updated = await this.databaseService.quiz.findUniqueOrThrow({
      where: { id },
      include: questionsInclude,
    });
    return this.toDetailDto(updated);
  }

  async publish(
    id: string,
    ownerId: string,
  ): Promise<{ id: string; permalink: string }> {
    const quiz = await this.getOwnedQuizOrThrow(id, ownerId);
    if (quiz.published) {
      throw new ConflictException('Quiz is already published');
    }

    const permalink = await generatePermalink(this.databaseService);
    const published = await this.databaseService.quiz.update({
      where: { id },
      data: { published: true, permalink },
      select: { id: true, permalink: true },
    });

    return { id: published.id, permalink: published.permalink as string };
  }

  private async getOwnedQuizOrThrow(id: string, ownerId: string) {
    const quiz = await this.databaseService.quiz.findUnique({
      where: { id },
      include: questionsInclude,
    });
    if (!quiz || quiz.ownerId !== ownerId) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }

  /**
   * Runs a write that may hit a unique index and rethrows a Prisma `P2002`
   * violation as a `ConflictException` with a caller-supplied message.
   */
  private async runUniqueWrite<T>(
    write: () => Promise<T>,
    message: string,
  ): Promise<T> {
    try {
      return await write();
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(message);
      }
      throw err;
    }
  }

  private buildQuestionsCreate(questions: QuestionDto[]) {
    return questions.map((question, order) =>
      this.buildOneQuestionCreate(question, order),
    );
  }

  private buildOneQuestionCreate(question: QuestionDto, order: number) {
    return {
      text: question.text,
      type: question.type,
      order,
      answers: {
        create: question.answers.map((answer, answerOrder) => ({
          text: answer.text,
          isCorrect: answer.isCorrect,
          order: answerOrder,
        })),
      },
    };
  }

  /**
   * Enforces the domain rules that DTO validation cannot express:
   * every question needs at least one correct answer, `SINGLE` questions
   * need exactly one, and question text is unique within the quiz.
   */
  private validateQuizInvariants(questions: QuestionDto[]): void {
    const seen = new Set<string>();

    questions.forEach((question, index) => {
      const correctCount = question.answers.filter((a) => a.isCorrect).length;
      const label = `Question ${index + 1}`;

      if (correctCount === 0) {
        throw new BadRequestException(`${label} must have a correct answer`);
      }
      if (question.type === QuestionType.SINGLE && correctCount !== 1) {
        throw new BadRequestException(
          `${label} is SINGLE and must have exactly one correct answer`,
        );
      }

      const answerTexts = new Set(
        question.answers.map((a) => normalize(a.text)),
      );
      if (answerTexts.size !== question.answers.length) {
        throw new BadRequestException(
          `${label} has two answers with the same text`,
        );
      }

      const key = normalize(question.text);
      if (seen.has(key)) {
        throw new BadRequestException(
          'Quiz has two questions with the same text',
        );
      }
      seen.add(key);
    });
  }

  private toDetailDto(quiz: {
    id: string;
    title: string;
    published: boolean;
    permalink: string | null;
    createdAt: Date;
    updatedAt: Date;
    questions: {
      id: string;
      text: string;
      type: QuestionType;
      answers: { id: string; text: string; isCorrect: boolean }[];
    }[];
  }): QuizDetailDto {
    return {
      id: quiz.id,
      title: quiz.title,
      published: quiz.published,
      permalink: quiz.permalink,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      questions: quiz.questions.map((question) => ({
        id: question.id,
        text: question.text,
        type: question.type,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          text: answer.text,
          isCorrect: answer.isCorrect,
        })),
      })),
    };
  }
}
