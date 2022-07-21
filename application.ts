import express from "express";
import path from "path";
import cors from "cors";

const app = express();

app.use(cors());

app.use("/playlist", express.static(path.join(__dirname, "playlist")));

app.listen(8888, () => {
  console.log("server on in: 8888");
});
