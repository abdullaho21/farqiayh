export type Status = "DRAFT" | "LIVE" | "CLOSED" | "FINAL" | "PUBLISHED";
export type OptionView = {
  id: string;
  label: string;
  mediaUrl: string | null;
  isText: boolean;
  votes: number;
  percentage: number;
  position: number;
};
export type QuestionView = {
  id: string;
  title: string;
  mediaUrl: string | null;
  type: "SINGLE" | "MULTIPLE";
  maxSelections: number;
  position: number;
  totalBallots: number;
  options: OptionView[];
  myVote: string[];
  textAnswers?: {
    id: string;
    text: string;
    optionId: string;
    displayName: string | null;
  }[];
};
export type RoundView = {
  id: string;
  number: number;
  status: string;
  participants: number;
  questions: QuestionView[];
};
export type PollView = {
  id: string;
  title: string;
  description: string;
  status: Status;
  currentRound: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  participants: number;
  totalVotes: number;
  rounds: RoundView[];
};
export type PollCard = Pick<
  PollView,
  | "id"
  | "title"
  | "description"
  | "status"
  | "currentRound"
  | "revision"
  | "createdAt"
  | "participants"
> & { questionCount: number; totalVotes: number };
