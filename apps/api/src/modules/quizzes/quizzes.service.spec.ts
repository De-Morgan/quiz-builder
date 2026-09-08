import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { DatabaseService } from '../../database/database.service';
import { QuestionType } from '../../database/generated/enums';
import { CreateQuizDto } from './dto/create-quiz.dto';

const OWNER = 'owner-1';

const singleQuestion = (correct = 1) => ({
  text: 'Capital of France?',
  type: QuestionType.SINGLE,
  answers: [
    { text: 'Paris', isCorrect: correct >= 1 },
    { text: 'Lyon', isCorrect: correct >= 2 },
  ],
});

const validDto = (): CreateQuizDto => ({
  title: 'Geo',
  questions: [singleQuestion()],
});

const storedQuiz = (overrides: Record<string, unknown> = {}) => ({
  id: 'quiz-1',
  title: 'Geo',
  published: false,
  permalink: null,
  ownerId: OWNER,
  createdAt: new Date(),
  updatedAt: new Date(),
  questions: [],
  ...overrides,
});

describe('QuizzesService', () => {
  let service: QuizzesService;
  let db: {
    quiz: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    question: {
      deleteMany: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    db = {
      quiz: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      question: {
        deleteMany: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'q-new' }),
        delete: jest.fn().mockResolvedValue({ id: 'q-1' }),
      },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [QuizzesService, { provide: DatabaseService, useValue: db }],
    }).compile();

    service = module.get(QuizzesService);
  });

  describe('create', () => {
    it('persists a nested quiz with ordered questions and answers', async () => {
      db.quiz.create.mockResolvedValue(storedQuiz());

      await service.create(OWNER, validDto());

      const arg = (db.quiz.create.mock.calls[0] as unknown[])[0] as {
        data: {
          ownerId: string;
          questions: {
            create: {
              order: number;
              answers: { create: { order: number }[] };
            }[];
          };
        };
      };
      expect(arg.data.ownerId).toBe(OWNER);
      expect(arg.data.questions.create[0]!.order).toBe(0);
      expect(arg.data.questions.create[0]!.answers.create[1]!.order).toBe(1);
    });

    it('rejects a SINGLE question without a correct answer', async () => {
      const dto: CreateQuizDto = {
        title: 'x',
        questions: [singleQuestion(0)],
      };
      await expect(service.create(OWNER, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(db.quiz.create).not.toHaveBeenCalled();
    });

    it('rejects a SINGLE question with two correct answers', async () => {
      const dto: CreateQuizDto = {
        title: 'x',
        questions: [singleQuestion(2)],
      };
      await expect(service.create(OWNER, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects a MULTIPLE question with no correct answers', async () => {
      const dto: CreateQuizDto = {
        title: 'x',
        questions: [
          {
            text: 'Pick primes',
            type: QuestionType.MULTIPLE,
            answers: [
              { text: '4', isCorrect: false },
              { text: '6', isCorrect: false },
            ],
          },
        ],
      };
      await expect(service.create(OWNER, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('accepts a MULTIPLE question with several correct answers', async () => {
      db.quiz.create.mockResolvedValue(storedQuiz());
      const dto: CreateQuizDto = {
        title: 'x',
        questions: [
          {
            text: 'Pick primes',
            type: QuestionType.MULTIPLE,
            answers: [
              { text: '2', isCorrect: true },
              { text: '3', isCorrect: true },
              { text: '4', isCorrect: false },
            ],
          },
        ],
      };
      await expect(service.create(OWNER, dto)).resolves.toBeDefined();
    });
  });

  describe('uniqueness rules', () => {
    it('allows two quizzes with the same title for one owner', async () => {
      db.quiz.create.mockResolvedValue(storedQuiz());
      await expect(service.create(OWNER, validDto())).resolves.toBeDefined();
      await expect(service.create(OWNER, validDto())).resolves.toBeDefined();
      expect(db.quiz.create).toHaveBeenCalledTimes(2);
    });

    it('rejects a question with two answers of the same text', async () => {
      const dto: CreateQuizDto = {
        title: 'x',
        questions: [
          {
            text: 'Capital of France?',
            type: QuestionType.SINGLE,
            answers: [
              { text: 'Paris', isCorrect: true },
              { text: ' paris ', isCorrect: false },
            ],
          },
        ],
      };
      await expect(service.create(OWNER, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(db.quiz.create).not.toHaveBeenCalled();
    });

    it('rejects a quiz whose questions share the same text', async () => {
      const dto: CreateQuizDto = {
        title: 'x',
        questions: [
          { ...singleQuestion(), text: 'Same' },
          { ...singleQuestion(), text: ' same ' },
        ],
      };
      await expect(service.create(OWNER, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('addQuestion', () => {
    const newQuestion = () => ({ ...singleQuestion(), text: 'Fresh' });

    it('rejects adding to a published quiz', async () => {
      db.quiz.findUnique.mockResolvedValue(storedQuiz({ published: true }));
      await expect(
        service.addQuestion('quiz-1', OWNER, newQuestion()),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects an 11th question', async () => {
      db.quiz.findUnique.mockResolvedValue(
        storedQuiz({
          questions: Array.from({ length: 10 }, (_, i) => ({
            id: `q${i}`,
            text: `q${i}`,
          })),
        }),
      );
      await expect(
        service.addQuestion('quiz-1', OWNER, newQuestion()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a question whose text duplicates an existing one', async () => {
      db.quiz.findUnique.mockResolvedValue(
        storedQuiz({ questions: [{ id: 'q0', text: 'Fresh' }] }),
      );
      await expect(
        service.addQuestion('quiz-1', OWNER, newQuestion()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('appends the question and returns the updated quiz', async () => {
      db.quiz.findUnique.mockResolvedValue(
        storedQuiz({ questions: [{ id: 'q0', text: 'old' }] }),
      );
      db.quiz.findUniqueOrThrow.mockResolvedValue(storedQuiz());
      await service.addQuestion('quiz-1', OWNER, newQuestion());
      const arg = (db.question.create.mock.calls[0] as unknown[])[0] as {
        data: { quizId: string; order: number };
      };
      expect(arg.data).toMatchObject({ quizId: 'quiz-1', order: 1 });
    });
  });

  describe('removeQuestion', () => {
    it('rejects removing from a published quiz', async () => {
      db.quiz.findUnique.mockResolvedValue(
        storedQuiz({
          published: true,
          questions: [
            { id: 'a', text: 'a' },
            { id: 'b', text: 'b' },
          ],
        }),
      );
      await expect(
        service.removeQuestion('quiz-1', OWNER, 'a'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('404s when the question is not in the quiz', async () => {
      db.quiz.findUnique.mockResolvedValue(
        storedQuiz({ questions: [{ id: 'a', text: 'a' }] }),
      );
      await expect(
        service.removeQuestion('quiz-1', OWNER, 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects removing the last remaining question', async () => {
      db.quiz.findUnique.mockResolvedValue(
        storedQuiz({ questions: [{ id: 'a', text: 'a' }] }),
      );
      await expect(
        service.removeQuestion('quiz-1', OWNER, 'a'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('deletes the question and returns the updated quiz', async () => {
      db.quiz.findUnique.mockResolvedValue(
        storedQuiz({
          questions: [
            { id: 'a', text: 'a' },
            { id: 'b', text: 'b' },
          ],
        }),
      );
      db.quiz.findUniqueOrThrow.mockResolvedValue(storedQuiz());
      await service.removeQuestion('quiz-1', OWNER, 'a');
      expect(db.question.delete).toHaveBeenCalledWith({ where: { id: 'a' } });
    });
  });

  describe('ownership', () => {
    it('throws NotFound when the quiz does not exist', async () => {
      db.quiz.findUnique.mockResolvedValue(null);
      await expect(
        service.findOneForOwner('quiz-1', OWNER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFound when the quiz belongs to someone else', async () => {
      db.quiz.findUnique.mockResolvedValue(storedQuiz({ ownerId: 'other' }));
      await expect(
        service.findOneForOwner('quiz-1', OWNER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('rejects editing a published quiz with a conflict', async () => {
      db.quiz.findUnique.mockResolvedValue(storedQuiz({ published: true }));
      await expect(
        service.update('quiz-1', OWNER, validDto()),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('replaces questions inside a transaction for an unpublished quiz', async () => {
      db.quiz.findUnique.mockResolvedValue(storedQuiz());
      db.quiz.findUniqueOrThrow.mockResolvedValue(storedQuiz());

      await service.update('quiz-1', OWNER, validDto());

      expect(db.question.deleteMany).toHaveBeenCalledWith({
        where: { quizId: 'quiz-1' },
      });
      expect(db.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('deletes an owned quiz regardless of published state', async () => {
      db.quiz.findUnique.mockResolvedValue(storedQuiz({ published: true }));
      await service.remove('quiz-1', OWNER);
      expect(db.quiz.delete).toHaveBeenCalledWith({ where: { id: 'quiz-1' } });
    });
  });

  describe('publish', () => {
    it('rejects publishing an already published quiz', async () => {
      db.quiz.findUnique.mockResolvedValue(storedQuiz({ published: true }));
      await expect(service.publish('quiz-1', OWNER)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('assigns a 6-character permalink and marks the quiz published', async () => {
      db.quiz.findUnique
        .mockResolvedValueOnce(storedQuiz())
        .mockResolvedValue(null);
      db.quiz.update.mockImplementation(
        (args: { data: { permalink: string } }) =>
          Promise.resolve({ id: 'quiz-1', permalink: args.data.permalink }),
      );

      const result = await service.publish('quiz-1', OWNER);

      expect(result.permalink).toMatch(/^[A-Za-z0-9]{6}$/);
      const updateArg = (db.quiz.update.mock.calls[0] as unknown[])[0] as {
        where: { id: string };
        data: { published: boolean; permalink: string };
      };
      expect(updateArg.where).toEqual({ id: 'quiz-1' });
      expect(updateArg.data.published).toBe(true);
      expect(updateArg.data.permalink).toMatch(/^[A-Za-z0-9]{6}$/);
    });
  });
});
