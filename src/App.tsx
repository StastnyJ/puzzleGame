import React, { useEffect, useState } from "react";
import { Button, Container, createStyles, makeStyles, Snackbar, TextField, Theme, Typography } from "@material-ui/core";
import { Alert, Color } from "@material-ui/lab";
import teams from "./Data/teams.json";
import puzzles from "./Data/puzzles.json";
import LoginForm from "./Components/LoginForm";
import { PuzzleProgress } from "./Types/types.d";
import { emptyPuzzleProgress, getCurrentPuzzleIndex } from "./Utils/progressUtils";
import { notifyComing, notifySolved } from "./Utils/notifications";
import Footer from "./Components/Footer";

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
  // eslint-disable-next-line
  const [loaded, setLoaded] = useState(false);

  const [currentCode, setCurrentCode] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");

  useEffect(() => {
    loggedTeam.length > 0 &&
      fetch("https://erecept.lekarnaselska.cz/stringSharer/api.php?key=puzzleGame" + loggedTeam)
        .then((res) =>
          res
            .json()
            .then((data: PuzzleProgress[]) => {
              if (data !== null && data.length > 0)
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
            .catch(() => {})
        )
        .catch((e) => {
          error("P??i ukl??d??n?? do??lo k chyb??, pros??m obnovte str??nku a zkuste to znova.");
          console.log(e);
        });
  }, [loggedTeam]);

  const saveProgress = (newProgress: PuzzleProgress[]) => {
    if (newProgress.length > 0 && (newProgress.length !== 1 || newProgress[0].opened)) {
      fetch("https://erecept.lekarnaselska.cz/stringSharer/api.php?key=puzzleGame" + loggedTeam, {
        method: "POST",
        body: JSON.stringify(newProgress),
      }).catch((e) => {
        error("P??i ukl??d??n?? do??lo k chyb??, pros??m obnovte str??nku a zkuste to znova.");
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
      success("P??ihl????en?? bylo ??sp????n??");
    } else {
      error("Neexistuj??c?? t??m ??i ??patn?? heslo");
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
                  label="V??sledn?? heslo (??e??en?? ??ifry)"
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
                      success("Gratulujeme, heslo je spr??vn??");
                    } else {
                      changeCurrentProgress({ ...currentTask, wrongAttempts: currentTask.wrongAttempts + 1 });
                      setCurrentPwd("");
                      error("Heslo nen?? spr??vn??");
                    }
                  }}
                >
                  Odeslat
                </Button>
                {puzzles[currentTaskId].hints.map((h, i) => (
                  <React.Fragment key={i}>
                    <br />
                    <br />
                    <Typography variant="h6">N??pov??da {i + 1}</Typography>
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
                            Po????dat o n??pov??du
                          </Button>
                        ) : (
                          <Typography>N??pov??da je dostupn?? od {hintAvailableFrom(i).toLocaleTimeString()}</Typography>
                        )}
                      </>
                    )}
                  </React.Fragment>
                ))}
              </>
            ) : currentTaskId >= puzzles.length ? (
              <>
                <Typography>
                  HOTOVO! Z??skal jsi tajemstv?? Mistra Legonarda a s n??m i moc pro pora??en?? LegoLase. M????e?? se vr??tit na objekt.
                </Typography>
              </>
            ) : (
              <>
                <TextField
                  label="K??d ??ifry"
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
                      error("K??d ??ifry nen?? spr??vn??");
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
      <Footer />
    </div>
  );
}
