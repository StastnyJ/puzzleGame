import React, { useState } from "react";
import { Button, Container, TextField } from "@material-ui/core";

interface IProps {
  login: (teamName: string, password: string) => void;
}

export default function LoginForm({ login }: IProps) {
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState("");

  return (
    <>
      <Container maxWidth="sm">
        <br />
        <br />
        <TextField fullWidth color="primary" label="Tým" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          fullWidth
          color="primary"
          label="Heslo"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <br />
        <br />
        <Button color="primary" onClick={() => login(name, pwd)} disabled={name.length === 0 || pwd.length === 0}>
          Přihlásit se
        </Button>
      </Container>
    </>
  );
}
