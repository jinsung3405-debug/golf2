export interface SwingScores {
  address: number;
  backswing: number;
  impact: number;
  finish: number;
}

export interface SwingAngles {
  spineAngleAddress: number;
  kneeFlexAddress: number;
  shaftAngleAddress: number;
}

export interface AnalysisResult {
  overallScore: number;
  scores: SwingScores;
  angles: SwingAngles;
  feedbackMarkdown: string;
}

export interface CapturedFrame {
  id: "address" | "backswing" | "impact" | "finish";
  label: string;
  description: string;
  timestamp: number; // in seconds of the video
  imageDataUrl: string | null;
}

export type ClubType = "driver" | "iron" | "wood_utility" | "wedge";
export type Handiness = "right" | "left";

export interface DrawingAction {
  type: "line" | "circle" | "text" | "clear";
  color: string;
}
