import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { QuestionType } from '../../database/generated/enums';
import { PublicService } from './public.service';
import { ScoringService } from './scoring.service';

const storedQuiz = () => ({
  id: 'quiz-1',
  title: 'Geo',
  published: true,
  permalink: 'aB3xY9',
  ownerId: 'owner-1',
  questions: [
    {
      id: 'q1',
      text: 'Capital of France?',
      type: QuestionType.SINGLE,
      answers: [
        { id: 'a1', text: 'Paris', isCorrect: true },
        { id: 'a2', text: 'Lyon', isCorrect: false },
      ],
    },
  ],
});

describe('PublicService', () => {
  let service: PublicService;
  let db: { quiz: { findFirst: jest.Mock } };

  beforeEach(async () => {
    db = { quiz: { findFirst: jest.fn() } };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicService,
        ScoringService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();
    service = module.get(PublicService);
  });

  it('queries only published quizzes by permalink', async () => {
    db.quiz.findFirst.mockResolvedValue(storedQuiz());
    await service.getByPermalink('aB3xY9');
    const arg = (db.quiz.findFirst.mock.calls[0] as unknown[])[0] as {
      where: Record<string, unknown>;
    };
    expect(arg.where).toEqual({ permalink: 'aB3xY9', published: true });
  });

  it('maps to a payload without isCorrect or owner info', async () => {
    db.quiz.findFirst.mockResolvedValue(storedQuiz());
    const dto = await service.getByPermalink('aB3xY9');
    expect(JSON.stringify(dto)).not.toContain('isCorrect');
    expect(dto).not.toHaveProperty('permalink');
    expect(dto).not.toHaveProperty('published');
    expect(dto.questions[0]!.answers[0]).toEqual({ id: 'a1', text: 'Paris' });
  });

  it('404s for an unknown or unpublished permalink', async () => {
    db.quiz.findFirst.mockResolvedValue(null);
    await expect(service.getByPermalink('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.submit('nope', {
        answers: [{ questionId: 'q1', answerIds: [] }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('submit returns a score and writes nothing', async () => {
    db.quiz.findFirst.mockResolvedValue(storedQuiz());
    const result = await service.submit('aB3xY9', {
      answers: [{ questionId: 'q1', answerIds: ['a1'] }],
    });
    expect(result).toEqual({ correct: 1, total: 1 });
  });
});
