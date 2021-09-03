import React, { useEffect, useState } from "react";
import { Button, Container, createStyles, makeStyles, Snackbar, TextField, Theme, Typography } from "@material-ui/core";
import { Alert, Color } from "@material-ui/lab";
import teams from "./Data/teams.json";
import puzzles from "./Data/puzzles.json";
import LoginForm from "./Components/LoginForm";
import { PuzzleProgress } from "./Types/types.d";
import { emptyPuzzleProgress, getCurrentPuzzleIndex } from "./Utils/progressUtils";
import { notifyComing, notifySolved } from "./Utils/notifications";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    image: {
      width: "80%",
      marginLeft: "10%",
    },
  })
);

export default function App() {
  const classes = useStyles();

  const [loggedTeam, setLoggedTeam] = useState(localStorage.getItem("pgLoggedTeamName") || "");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<Color>("success");
  const [alertText, setAlertText] = useState("");
  const [progress, setProgress] = useState<PuzzleProgress[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [currentCode, setCurrentCode] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");

  useEffect(() => {
    fetch("https://erecept.lekarnaselska.cz/stringSharer/api.php?key=puzzleGame" + loggedTeam)
      .then((res) =>
        res.json().then((data: PuzzleProgress[]) => {
          if (data && data.length > 0)
            setProgress(
              data.map((d) => {
                return {
                  ...d,
                  openedIn: new Date(d.openedIn),
                  solvedIn: new Date(d.solvedIn),
                };
              })
            );
          else setProgress([]);
          setLoaded(true);
        })
      )
      .catch((e) => error("Při načítání dat došlo k chybě, prosím obnovte stránku a zkuste to znova."));
  }, [loggedTeam]);

  const saveProgress = (newProgress: PuzzleProgress[]) => {
    if (loaded) {
      fetch("https://erecept.lekarnaselska.cz/stringSharer/api.php?key=puzzleGame" + loggedTeam, {
        method: "POST",
        body: JSON.stringify(newProgress),
      }).catch((e) => {
        error("Při ukládání došlo k chybě, prosím obnovte stránku a zkuste to znova.");
        console.log(e);
      });
    }
    setProgress(newProgress);
  };

  const currentTaskId = getCurrentPuzzleIndex(progress);
  if (currentTaskId >= progress.length) saveProgress([...progress, emptyPuzzleProgress]);

  const currentTask = progress[currentTaskId] || emptyPuzzleProgress;

  const changeCurrentProgress = (newPuzzleProgress: PuzzleProgress) => {
    const newProgress = [...progress];
    newProgress[currentTaskId] = newPuzzleProgress;
    saveProgress(newProgress);
  };

  const login = (teamName: string, password: string) => {
    if (teamName in teams && teams[teamName as never] === password) {
      setLoggedTeam(teamName);
      localStorage.setItem("pgLoggedTeamName", teamName);
      success("Přihlášení bylo úspěšné");
    } else {
      error("Neexistující tým či špatné heslo");
    }
  };

  const success = (text: string) => {
    setAlertText(text);
    setAlertSeverity("success");
    setAlertOpen(true);
  };

  const error = (text: string) => {
    setAlertText(text);
    setAlertSeverity("error");
    setAlertOpen(true);
  };

  const hintAvailableFrom = (hintId: number) => {
    const hint = puzzles[currentTaskId].hints[hintId];
    const availableFrom = new Date(currentTask.openedIn);
    availableFrom.setMinutes(availableFrom.getMinutes() + hint.availableAfter);
    return availableFrom;
  };

  const isHintAvailable = (hintId: number) => hintAvailableFrom(hintId).getTime() <= new Date().getTime();

  console.log(progress);

  return (
    <div className={classes.root}>
      {/* <Button onClick={() => saveProgress([])}>RESET (REMOVE AFTER DEBUG)</Button> */}
      {loggedTeam === "" ? (
        <>
          <LoginForm login={login} />
        </>
      ) : (
        <>
          <br />
          <Container maxWidth="sm">
            {currentTask.opened ? (
              <>
                <TextField
                  label="Výsledné heslo (řešení šifry)"
                  value={currentPwd}
                  fullWidth
                  color="primary"
                  onChange={(e) => setCurrentPwd(e.target.value)}
                />
                <Button
                  disabled={currentPwd.length === 0}
                  color="primary"
                  onClick={() => {
                    if (puzzles[currentTaskId].puzzlePassword.toLowerCase() === currentPwd.toLowerCase()) {
                      changeCurrentProgress({ ...currentTask, solved: true, solvedIn: new Date() });
                      setCurrentPwd("");
                      notifySolved(loggedTeam, puzzles[currentTaskId].workingName, currentTaskId);
                      success("Gratulujeme, heslo je správně");
                    } else {
                      changeCurrentProgress({ ...currentTask, wrongAttempts: currentTask.wrongAttempts + 1 });
                      setCurrentPwd("");
                      error("Heslo není správné");
                    }
                  }}
                >
                  Odeslat
                </Button>
                {puzzles[currentTaskId].hints.map((h, i) => (
                  <React.Fragment key={i}>
                    <br />
                    <br />
                    <Typography variant="h6">Nápověda {i + 1}</Typography>
                    {currentTask.openedHints.includes(i) ? (
                      <>
                        {h.type === "text" ? (
                          <Typography>{h.value}</Typography>
                        ) : (
                          <img src={h.value} alt="" className={classes.image} />
                        )}
                      </>
                    ) : (
                      <>
                        {isHintAvailable(i) ? (
                          <Button
                            color="primary"
                            onClick={() =>
                              changeCurrentProgress({ ...currentTask, openedHints: [...currentTask.openedHints, i] })
                            }
                          >
                            Požádat o nápovědu
                          </Button>
                        ) : (
                          <Typography>Nápověda je dostupná od {hintAvailableFrom(i).toLocaleTimeString()}</Typography>
                        )}
                      </>
                    )}
                  </React.Fragment>
                ))}
              </>
            ) : currentTaskId >= puzzles.length ? (
              <>
                <Typography>
                  HOTOVO! Získal jsi tajemství Mistra Legonarda a s ním i moc pro poražení LegoLase. Můžeš se vrátit na objekt.
                </Typography>
              </>
            ) : (
              <>
                <TextField
                  label="Kód šifry"
                  value={currentCode}
                  fullWidth
                  color="primary"
                  onChange={(e) => setCurrentCode(e.target.value)}
                />
                <Button
                  disabled={currentCode.length === 0}
                  color="primary"
                  onClick={() => {
                    if (puzzles[currentTaskId].puzzleCode.toLowerCase() === currentCode.toLowerCase()) {
                      changeCurrentProgress({ ...currentTask, opened: true, openedIn: new Date() });
                      notifyComing(loggedTeam, puzzles[currentTaskId].workingName, currentTaskId);
                      setCurrentCode("");
                    } else {
                      error("Kód šifry není správný");
                    }
                  }}
                >
                  Odeslat
                </Button>
                {puzzles[currentTaskId].positionLocation.type === "text" ? (
                  <Typography>{puzzles[currentTaskId].positionLocation.value}</Typography>
                ) : (
                  <img src={puzzles[currentTaskId].positionLocation.value} alt="" className={classes.image} />
                )}
              </>
            )}
          </Container>
        </>
      )}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={alertOpen}
        autoHideDuration={6000}
        onClose={() => setAlertOpen(false)}
      >
        <Alert variant="filled" onClose={() => setAlertOpen(false)} severity={alertSeverity}>
          {alertText}
        </Alert>
      </Snackbar>
    </div>
  );
}
