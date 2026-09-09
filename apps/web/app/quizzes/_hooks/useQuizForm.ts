"use client";

import { useMemo, useReducer } from "react";

import type {
  AnswerInput,
  QuestionInput,
  QuestionType,
  QuizDetail,
} from "@/lib/types";

export type QuizFormState = {
  title: string;
  questions: QuestionInput[];
};

export function blankAnswer(): AnswerInput {
  return { text: "", isCorrect: false };
}

export function blankQuestion(): QuestionInput {
  return {
    text: "",
    type: "SINGLE",
    answers: [blankAnswer(), blankAnswer()],
  };
}

export function emptyQuizForm(): QuizFormState {
  return { title: "", questions: [blankQuestion()] };
}

export function quizDetailToForm(quiz: QuizDetail): QuizFormState {
  return {
    title: quiz.title,
    questions: quiz.questions.map((q) => ({
      text: q.text,
      type: q.type,
      answers: q.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect })),
    })),
  };
}

/** SINGLE keeps only the first correct answer; MULTIPLE is left as-is. */
function normalizeCorrect(
  type: QuestionType,
  answers: AnswerInput[],
): AnswerInput[] {
  if (type !== "SINGLE") return answers;
  let seen = false;
  return answers.map((a) => {
    if (a.isCorrect && !seen) {
      seen = true;
      return a;
    }
    return a.isCorrect ? { ...a, isCorrect: false } : a;
  });
}

type Action =
  | { type: "reset"; state: QuizFormState }
  | { type: "setTitle"; title: string }
  | { type: "addQuestion" }
  | { type: "removeQuestion"; index: number }
  | { type: "setQuestionText"; index: number; text: string }
  | { type: "setQuestionType"; index: number; questionType: QuestionType }
  | { type: "addAnswer"; qIndex: number }
  | { type: "removeAnswer"; qIndex: number; aIndex: number }
  | { type: "setAnswerText"; qIndex: number; aIndex: number; text: string }
  | {
      type: "setAnswerCorrect";
      qIndex: number;
      aIndex: number;
      isCorrect: boolean;
    };

function mapQuestion(
  state: QuizFormState,
  index: number,
  fn: (q: QuestionInput) => QuestionInput,
): QuizFormState {
  return {
    ...state,
    questions: state.questions.map((q, i) => (i === index ? fn(q) : q)),
  };
}

function reducer(state: QuizFormState, action: Action): QuizFormState {
  switch (action.type) {
    case "reset":
      return action.state;
    case "setTitle":
      return { ...state, title: action.title };
    case "addQuestion":
      return { ...state, questions: [...state.questions, blankQuestion()] };
    case "removeQuestion":
      return {
        ...state,
        questions: state.questions.filter((_, i) => i !== action.index),
      };
    case "setQuestionText":
      return mapQuestion(state, action.index, (q) => ({
        ...q,
        text: action.text,
      }));
    case "setQuestionType":
      return mapQuestion(state, action.index, (q) => ({
        ...q,
        type: action.questionType,
        answers: normalizeCorrect(action.questionType, q.answers),
      }));
    case "addAnswer":
      return mapQuestion(state, action.qIndex, (q) => ({
        ...q,
        answers: [...q.answers, blankAnswer()],
      }));
    case "removeAnswer":
      return mapQuestion(state, action.qIndex, (q) => ({
        ...q,
        answers: q.answers.filter((_, i) => i !== action.aIndex),
      }));
    case "setAnswerText":
      return mapQuestion(state, action.qIndex, (q) => ({
        ...q,
        answers: q.answers.map((a, i) =>
          i === action.aIndex ? { ...a, text: action.text } : a,
        ),
      }));
    case "setAnswerCorrect":
      return mapQuestion(state, action.qIndex, (q) => {
        const answers = q.answers.map((a, i) => {
          if (i === action.aIndex) return { ...a, isCorrect: action.isCorrect };
          // SINGLE is exclusive: turning one on turns the rest off.
          if (q.type === "SINGLE" && action.isCorrect)
            return { ...a, isCorrect: false };
          return a;
        });
        return { ...q, answers };
      });
    default:
      return state;
  }
}

export function useQuizForm(initial?: QuizFormState) {
  const [state, dispatch] = useReducer(reducer, initial ?? emptyQuizForm());

  const actions = useMemo(
    () => ({
      reset: (next: QuizFormState) => dispatch({ type: "reset", state: next }),
      setTitle: (title: string) => dispatch({ type: "setTitle", title }),
      addQuestion: () => dispatch({ type: "addQuestion" }),
      removeQuestion: (index: number) =>
        dispatch({ type: "removeQuestion", index }),
      setQuestionText: (index: number, text: string) =>
        dispatch({ type: "setQuestionText", index, text }),
      setQuestionType: (index: number, questionType: QuestionType) =>
        dispatch({ type: "setQuestionType", index, questionType }),
      addAnswer: (qIndex: number) => dispatch({ type: "addAnswer", qIndex }),
      removeAnswer: (qIndex: number, aIndex: number) =>
        dispatch({ type: "removeAnswer", qIndex, aIndex }),
      setAnswerText: (qIndex: number, aIndex: number, text: string) =>
        dispatch({ type: "setAnswerText", qIndex, aIndex, text }),
      setAnswerCorrect: (qIndex: number, aIndex: number, isCorrect: boolean) =>
        dispatch({ type: "setAnswerCorrect", qIndex, aIndex, isCorrect }),
    }),
    [],
  );

  return { state, actions };
}

export type QuizFormActions = ReturnType<typeof useQuizForm>["actions"];
