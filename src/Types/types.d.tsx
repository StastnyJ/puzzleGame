export interface PuzzleProgress {
  opened: boolean;
  openedIn: Date;
  openedHints: number[];
  solved: boolean;
  solvedIn: Date;
  wrongAttempts: number;
}
