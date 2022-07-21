require("dotenv").config();
require("./application");
import NodeMediaServer from "node-media-server";
import { instance } from "./axios";
import { NodeTransSession } from "./hls-session";

const config = {
  logType: 3,
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
};

var nms = new NodeMediaServer(config as any);

nms.on("prePublish", async (id: any, StreamPath: any, args: any) => {
  console.log(
    "[NodeEvent on prePublish]",
    `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
  );

  const session = nms.getSession(id) as any;

  const stream_key_rtmp = StreamPath.split("/")[2];

  const streaming = await instance.post("/create-streaming", {
    stream_key: stream_key_rtmp,
  });
  
  if (streaming.data.authorized) {
    new NodeTransSession(
      stream_key_rtmp,
      streaming.data.streaming_key_encoded
    ).run();
  } else {
    session.reject();
  }
});

nms.on("postPublish", (id: any, StreamPath: string, args: any) => {
  console.log(
    "[NodeEvent on postPublish]",
    `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
  );
});

nms.on("donePublish", (id: any, StreamPath: any, args: any) => {
  console.log(
    "[NodeEvent on donePublish]",
    `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
  );
});

nms.run();
