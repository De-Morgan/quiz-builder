import { QuestionType } from '../../database/generated/enums';
import { ScorableQuiz, ScoringService } from './scoring.service';
import { SubmitDto } from './dto/submit.dto';

const quiz: ScorableQuiz = {
  questions: [
    {
      id: 'q-single',
      type: QuestionType.SINGLE,
      answers: [
        { id: 's-a', isCorrect: true },
        { id: 's-b', isCorrect: false },
        { id: 's-c', isCorrect: false },
      ],
    },
    {
      id: 'q-multi',
      type: QuestionType.MULTIPLE,
      answers: [
        { id: 'm-a', isCorrect: true },
        { id: 'm-b', isCorrect: true },
        { id: 'm-c', isCorrect: false },
      ],
    },
  ],
};

const submit = (answers: SubmitDto['answers']): SubmitDto => ({ answers });

describe('ScoringService', () => {
  const service = new ScoringService();

  it('scores a fully correct submission', () => {
    const result = service.score(
      quiz,
      submit([
        { questionId: 'q-single', answerIds: ['s-a'] },
        { questionId: 'q-multi', answerIds: ['m-a', 'm-b'] },
      ]),
    );
    expect(result).toEqual({ correct: 2, total: 2 });
  });

  it('SINGLE: wrong answer scores 0', () => {
    expect(
      service.score(
        quiz,
        submit([{ questionId: 'q-single', answerIds: ['s-b'] }]),
      ).correct,
    ).toBe(0);
  });

  it('SINGLE: selecting the correct plus another scores 0 (defensive)', () => {
    expect(
      service.score(
        quiz,
        submit([{ questionId: 'q-single', answerIds: ['s-a', 's-b'] }]),
      ).correct,
    ).toBe(0);
  });

  it('MULTIPLE: partial selection scores 0', () => {
    expect(
      service.score(
        quiz,
        submit([{ questionId: 'q-multi', answerIds: ['m-a'] }]),
      ).correct,
    ).toBe(0);
  });

  it('MULTIPLE: superset (includes an incorrect answer) scores 0', () => {
    expect(
      service.score(
        quiz,
        submit([{ questionId: 'q-multi', answerIds: ['m-a', 'm-b', 'm-c'] }]),
      ).correct,
    ).toBe(0);
  });

  it('MULTIPLE: exact set scores 1 regardless of order', () => {
    expect(
      service.score(
        quiz,
        submit([{ questionId: 'q-multi', answerIds: ['m-b', 'm-a'] }]),
      ).correct,
    ).toBe(1);
  });

  it('ignores unknown answer ids', () => {
    expect(
      service.score(
        quiz,
        submit([{ questionId: 'q-single', answerIds: ['s-a', 'nope'] }]),
      ).correct,
    ).toBe(1);
  });

  it('unknown question id does not add to the score', () => {
    const result = service.score(
      quiz,
      submit([
        { questionId: 'ghost', answerIds: ['x'] },
        { questionId: 'q-single', answerIds: ['s-a'] },
      ]),
    );
    expect(result).toEqual({ correct: 1, total: 2 });
  });

  it('missing questions count as incorrect', () => {
    expect(
      service.score(
        quiz,
        submit([{ questionId: 'q-single', answerIds: ['s-a'] }]),
      ),
    ).toEqual({ correct: 1, total: 2 });
  });

  it('empty selections score 0 out of total', () => {
    expect(
      service.score(
        quiz,
        submit([
          { questionId: 'q-single', answerIds: [] },
          { questionId: 'q-multi', answerIds: [] },
        ]),
      ),
    ).toEqual({ correct: 0, total: 2 });
  });
});
