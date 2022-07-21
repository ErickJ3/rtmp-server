import EventEmitter from "events";
import { spawn } from "child_process";
import mkdirp from "mkdirp";
import fs from "fs";
import path from "path";
import { instance } from "./axios";

const path_ffmpeg = path.resolve(__dirname + "/bin/ffmpeg.exe");

export class NodeTransSession extends EventEmitter {
  conf: {
    vcParam?: any;
    acParam?: any;
    ac?: string;
    vc?: string;
    hls: boolean;
    ffmpeg: string;
    rtmpPort: number;
    streamPath: string;
    streamApp: string;
    streamNameRTMP: string;
    hlsFlags: string;
    stream_encoded: string;
  };
  ffmpeg_exec: any;

  constructor(stream_name: string, stream_encoded_base64: string) {
    super();
    this.conf = {
      hls: true,
      ffmpeg: path_ffmpeg,
      rtmpPort: 1935,
      streamPath: "/live",
      streamApp: "live",
      streamNameRTMP: stream_name,
      stream_encoded: stream_encoded_base64,
      hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
    };
  }

  run() {
    let vc = this.conf.vc || "copy";
    let ac = this.conf.ac || "copy";
    let inPath = `rtmp://localhost:1935/live/${this.conf.streamNameRTMP}`;
    let ouPath = `./playlist/${this.conf.streamApp}/${this.conf.stream_encoded}`;
    let mapStr = "";

    mkdirp.sync(ouPath);

    this.conf.hlsFlags = this.conf.hlsFlags ? this.conf.hlsFlags : "";
    let hlsFileName = `${this.conf.stream_encoded}.m3u8`;
    let mapHls = `${this.conf.hlsFlags}${ouPath}/${hlsFileName}|`;
    mapStr += mapHls;
    console.log(
      "[Transmuxing HLS] " +
        this.conf.streamPath +
        " to " +
        ouPath +
        "/" +
        hlsFileName
    );

    let argv = ["-y", "-i", inPath];
    Array.prototype.push.apply(argv, ["-c:v", vc]);
    Array.prototype.push.apply(argv, this.conf.vcParam);
    Array.prototype.push.apply(argv, ["-c:a", ac]);
    Array.prototype.push.apply(argv, this.conf.acParam);
    Array.prototype.push.apply(argv, [
      "-f",
      "tee",
      "-map",
      "0:a?",
      "-map",
      "0:v?",
      mapStr,
    ]);

    this.ffmpeg_exec = spawn(this.conf.ffmpeg, argv);

    setTimeout(() => {
      spawn(this.conf.ffmpeg, [
        "-i",
        inPath,
        "-ss",
        "00:00:02.000",
        "-vframes",
        "1",
        `${ouPath}/${this.conf.stream_encoded}.png`,
      ]).kill(0);
    }, 5000);

    this.ffmpeg_exec.on("error", (e: any) => {
      console.debug("error:", e);
    });

    this.ffmpeg_exec.stdout.on("data", (data: any) => {
      console.debug(`data: ${data}`);
    });

    this.ffmpeg_exec.stderr.on("data", (data: any) => {
      console.debug(`data: ${data}`);
    });

    this.ffmpeg_exec.on("close", async (code: any) => {
      console.log(
        "[Transmuxing end] " +
          this.conf.streamPath +
          " stream: " +
          this.conf.streamNameRTMP
      );

      await instance.post("/update-streaming-internal", {
        stream_key: this.conf.streamNameRTMP,
      });

      fs.readdir(ouPath, function (err, files) {
        if (!err) {
          files.forEach((filename) => {
            if (
              filename.endsWith(".ts") ||
              filename.endsWith(".m3u8") ||
              filename.endsWith(".png") ||
              filename.endsWith(".tmp")
            ) {
              fs.unlinkSync(ouPath + "/" + filename);
            }
          });
        }
      });
    });
  }

  end() {
    this.ffmpeg_exec.kill();
  }
}
