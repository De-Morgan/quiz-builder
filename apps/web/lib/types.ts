export type QuestionType = "SINGLE" | "MULTIPLE";

export type QuizSummary = {
  id: string;
  title: string;
  published: boolean;
  permalink: string | null;
  questionCount: number;
};

export type PublicAnswer = { id: string; text: string };

export type Answer = PublicAnswer & { isCorrect: boolean };

export type Question = {
  id: string;
  text: string;
  type: QuestionType;
  answers: Answer[];
};

export type QuizDetail = {
  id: string;
  title: string;
  published: boolean;
  permalink: string | null;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
};

export type PublicQuestion = {
  id: string;
  text: string;
  type: QuestionType;
  answers: PublicAnswer[];
};

export type PublicQuiz = {
  id: string;
  title: string;
  questions: PublicQuestion[];
};

// request bodies
export type AnswerInput = { text: string; isCorrect: boolean };

export type QuestionInput = {
  text: string;
  type: QuestionType;
  answers: AnswerInput[]; // 2–5 answers
};

export type CreateQuizDto = {
  title: string;
  questions: QuestionInput[]; // 1–10 questions
};

export type UpdateQuizDto = {
  title?: string;
  questions?: QuestionInput[];
};

export type UpdateQuestionDto = {
  text?: string;
  type?: QuestionType;
  answers?: AnswerInput[];
};

export type SubmitDto = {
  answers: { questionId: string; answerIds: string[] }[];
};

export type Score = { correct: number; total: number };

export type AuthResponse = {
  accessToken: string;
  user: { id: string; email: string };
};

export type CurrentUser = { id: string; email: string };
