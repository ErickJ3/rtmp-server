require("dotenv").config();
const NodeMediaServer = require("node-media-server");

const config = {
  logType: 3,
  rtmp: {
    port: process.env.PORT ,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
};

var nms = new NodeMediaServer(config);
nms.run();
