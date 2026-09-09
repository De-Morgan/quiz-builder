
import type { QuestionInput, QuestionType } from "./types";

const normalize = (text: string): string => text.trim().toLowerCase();

export function correctCount(answers: { isCorrect: boolean }[]): number {
  return answers.filter((a) => a.isCorrect).length;
}

/** Validate a single question. Returns a list of error messages (empty = ok). */
export function validateQuestion(
  question: QuestionInput,
  label = "Question",
): string[] {
  const errors: string[] = [];

  if (!question.text.trim()) {
    errors.push(`${label}: text is required`);
  }

  if (question.answers.length < 2 || question.answers.length > 5) {
    errors.push(`${label}: must have between 2 and 5 answers`);
  }

  if (question.answers.some((a) => !a.text.trim())) {
    errors.push(`${label}: every answer needs text`);
  }

  const texts = question.answers.map((a) => normalize(a.text));
  if (new Set(texts).size !== texts.length) {
    errors.push(`${label}: answer texts must be unique`);
  }

  const correct = correctCount(question.answers);
  const type: QuestionType = question.type;
  if (type === "SINGLE" && correct !== 1) {
    errors.push(`${label}: SINGLE questions need exactly one correct answer`);
  }
  if (type === "MULTIPLE" && correct < 1) {
    errors.push(`${label}: MULTIPLE questions need at least one correct answer`);
  }

  return errors;
}

/** Validate the whole quiz. Returns a flat list of error messages. */
export function validateQuiz(quiz: {
  title: string;
  questions: QuestionInput[];
}): string[] {
  const errors: string[] = [];

  if (!quiz.title.trim()) {
    errors.push("Title is required");
  }

  if (quiz.questions.length < 1 || quiz.questions.length > 10) {
    errors.push("A quiz must have between 1 and 10 questions");
  }

  quiz.questions.forEach((question, i) => {
    errors.push(...validateQuestion(question, `Question ${i + 1}`));
  });

  const questionTexts = quiz.questions.map((q) => normalize(q.text));
  if (new Set(questionTexts).size !== questionTexts.length) {
    errors.push("Question texts must be unique within the quiz");
  }

  return errors;
}
