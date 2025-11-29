import { createRequestHandler } from "@remix-run/express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

import * as build from "./build/server/index.js";

const app = express();

// Trust proxy headers from nginx
app.set('trust proxy', true);

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

// Use PORT from environment, default to 3000
const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  console.log(`ChainMaker server listening on port ${PORT}`);
});
