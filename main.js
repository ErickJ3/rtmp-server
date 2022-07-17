require("dotenv").config();
const NodeMediaServer = require("node-media-server");

const config = {
  logType: 3,
  rtmp: {
    port: process.env.PORT || 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8080,
    allow_origin: '*'
},
};

var nms = new NodeMediaServer(config);
nms.run();
