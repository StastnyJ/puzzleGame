import React from "react";

export default function Footer() {
  return (
    <>
      <div style={{ height: 400 }}></div>
      <div style={{ position: "absolute", bottom: 0, width: "calc(100vw - 16px)", padding: 8 }}>
        <hr />
        <p>Nouzové kontaky: </p> <b>+420 605 193 116</b> (Kuba)
        <br />
        <b>+420 737 788 503</b> (Barča)
      </div>
    </>
  );
}
