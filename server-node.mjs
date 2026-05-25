import http from "node:http";
import { toNodeHandler } from "srvx/node";
import serverModule from "./dist/server/server.js";

const handler = toNodeHandler((req) => serverModule.fetch(req, {}, {}));
const port = parseInt(process.env.PORT || "3000", 10);

http.createServer(handler).listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
