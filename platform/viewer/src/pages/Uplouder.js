import React, { useEffect } from "react";
import { Link as RouterLink, useLocation, matchPath } from "react-router-dom";

function UplouderPage() {
  return (
    <div
      className="App"
      style={{
        backgroundColor: "#fff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#000",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-around",
          minHeight: "80vh",
          color: "#000",
        }}
      >
        <div>
          <div>
            <h1
              style={{
                color: "#000",
                fontSize: "2rem",
              }}
            >
              RadCad
            </h1>
          </div>
          <div>
            <h2
              style={{
                color: "#000",
              }}
            >
              By CCIPD{" "}
            </h2>
          </div>
          <div>
            <h2
              style={{
                color: "#000",
              }}
            >
              https://radcad.thetatech.ai{" "}
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            borderRadius: "5px",
            border: "1px solid blue",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              marginBottom: "20px",
              backgroundColor: "grey",
            }}
          ></div>
          <RouterLink to="/">
            <button className="primary-btn">login</button>
          </RouterLink>
        </div>
      </div>
    </div>
  );
}

export default UplouderPage;
