import { PuzzleProgress } from "../Types/types.d";

export const emptyPuzzleProgress = {
  opened: false,
  openedIn: new Date(),
  openedHints: [],
  solved: false,
  solvedIn: new Date(),
  wrongAttempts: 0,
};

export const getCurrentPuzzleIndex = (progress: PuzzleProgress[]) => {
  for (let i = 0; i < progress.length; i++) {
    if (!progress[i].solved) return i;
  }
  return progress.length;
};
