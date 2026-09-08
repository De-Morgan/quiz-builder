import { Injectable } from '@nestjs/common';
import { QuestionType } from '../../database/generated/enums';
import { ScoreDto } from './dto/score.dto';
import { SubmitDto } from './dto/submit.dto';

export interface ScorableAnswer {
  id: string;
  isCorrect: boolean;
}

export interface ScorableQuestion {
  id: string;
  type: QuestionType;
  answers: ScorableAnswer[];
}

export interface ScorableQuiz {
  questions: ScorableQuestion[];
}

const setEquals = (a: Set<string>, b: Set<string>): boolean =>
  a.size === b.size && [...a].every((value) => b.has(value));

@Injectable()
export class ScoringService {
  /**
   * Pure scoring: compares the visitor's selected answers against the correct
   * set for every question on the quiz. Nothing is persisted.
   *
   * - Unknown `answerIds` are ignored; a missing/unknown question scores 0.
   * - `SINGLE`: correct iff exactly the one correct answer is selected.
   * - `MULTIPLE`: correct iff the selected set equals the correct set exactly.
   */
  score(quiz: ScorableQuiz, submission: SubmitDto): ScoreDto {
    const selectionByQuestion = new Map<string, string[]>();
    for (const entry of submission.answers) {
      selectionByQuestion.set(entry.questionId, entry.answerIds);
    }

    let correct = 0;

    for (const question of quiz.questions) {
      const validAnswerIds = new Set(question.answers.map((a) => a.id));
      const correctSet = new Set(
        question.answers.filter((a) => a.isCorrect).map((a) => a.id),
      );
      const selectedSet = new Set(
        (selectionByQuestion.get(question.id) ?? []).filter((id) =>
          validAnswerIds.has(id),
        ),
      );

      if (question.type === QuestionType.SINGLE) {
        const [theCorrectId] = correctSet;
        if (selectedSet.size === 1 && selectedSet.has(theCorrectId!)) {
          correct += 1;
        }
        continue;
      }

      if (setEquals(selectedSet, correctSet)) {
        correct += 1;
      }
    }

    return { correct, total: quiz.questions.length };
  }
}
