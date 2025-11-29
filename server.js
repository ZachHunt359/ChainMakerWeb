import { createRequestHandler } from "@remix-run/express";
import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";

import * as build from "./build/server/index.js";

const app = express();
app.use(express.static("build/client"));
app.use("/user_images", (req, res) => {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "public/user_images", req.path);
  console.log(file);
  res.sendFile(file, { dotfiles: "deny" }, (err) => {
    if (err) {
      console.log(err);
      res.sendStatus(404);
    }
  });
});

app.all(/^\/(?!user_images).*/i, createRequestHandler({ build }));

const redirectApp = express();

redirectApp.get("*", function (req, res) {
  res.redirect("https://" + req.headers.host + req.path);
});

var httpServer = http.createServer(app);
httpServer.listen(80);

if (process.env.USE_HTTPS == "true") {
  const credentials = {
    key: fs.readFileSync(path.resolve(process.env.CERT_PATH, "privkey.pem"), "utf8"),
    cert: fs.readFileSync(path.resolve(process.env.CERT_PATH, "cert.pem"), "utf8"),
  };
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(443);
}
