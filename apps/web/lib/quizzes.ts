// Mutation helpers — thin wrappers over `http` + `endpoints`. Each returns the
// parsed response body. Callers are responsible for calling SWR `mutate()`
// afterwards.

import { http } from "./api";
import { api } from "./endpoints";
import type {
  CreateQuizDto,
  CurrentUser,
  QuestionInput,
  QuizDetail,
  Score,
  SubmitDto,
  UpdateQuestionDto,
  UpdateQuizDto,
} from "./types";

export async function getMe(): Promise<CurrentUser> {
  const res = await http.get<CurrentUser>(api.me);
  return res.data;
}

export async function createQuiz(dto: CreateQuizDto): Promise<QuizDetail> {
  const res = await http.post<QuizDetail>(api.quizzes, dto);
  return res.data;
}

export async function updateQuiz(
  id: string,
  dto: UpdateQuizDto,
): Promise<QuizDetail> {
  const res = await http.patch<QuizDetail>(api.quiz(id), dto);
  return res.data;
}

export async function addQuestion(
  id: string,
  question: QuestionInput,
): Promise<QuizDetail> {
  const res = await http.post<QuizDetail>(api.quizQuestions(id), question);
  return res.data;
}

export async function updateQuestion(
  id: string,
  questionId: string,
  dto: UpdateQuestionDto,
): Promise<QuizDetail> {
  const res = await http.patch<QuizDetail>(
    api.quizQuestion(id, questionId),
    dto,
  );
  return res.data;
}

export async function deleteQuestion(
  id: string,
  questionId: string,
): Promise<QuizDetail> {
  const res = await http.delete<QuizDetail>(api.quizQuestion(id, questionId));
  return res.data;
}

export async function deleteQuiz(id: string): Promise<void> {
  await http.delete(api.quiz(id));
}

export async function submitQuiz(
  permalink: string,
  dto: SubmitDto,
): Promise<Score> {
  const res = await http.post<Score>(api.submit(permalink), dto);
  return res.data;
}

export async function publishQuiz(
  id: string,
): Promise<{ id: string; permalink: string }> {
  const res = await http.post<{ id: string; permalink: string }>(
    api.publish(id),
  );
  return res.data;
}
