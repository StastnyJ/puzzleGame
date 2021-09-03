export const notify = (content: string) => {
  fetch(
    "https://discord.com/api/webhooks/883401477123624960/Kszt4DwtfRQWhwOXdJgnMQVgSzxWu50XFqHYxsDit1eAa865apthHSX6C3TpR4DX_LnL",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: content,
      }),
    }
  );
};

export const notifyComing = (team: string, puzzleName: string, puzzleNumber: number) => {
  notify(`[${new Date().toLocaleTimeString()}] Tým **${team}** dorazil na stanoviště č. ${puzzleNumber}: **${puzzleName}**`);
};

export const notifySolved = (team: string, puzzleName: string, puzzleNumber: number) => {
  notify(`[${new Date().toLocaleTimeString()}] Tým **${team}** vyřešil šifru č. ${puzzleNumber}: **${puzzleName}**`);
};
