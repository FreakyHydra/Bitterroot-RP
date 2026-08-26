import { createServer } from "node:http";
import { createApp } from "./http/app.js";

const port = parsePort(process.env.PORT, 2030);
const host = process.env.HOST ?? "127.0.0.1";
const server = createServer(createApp());

server.listen(port, host, () => {
  console.log(`Bitterroot RP backend listening on http://${host}:${port}`);
});

function parsePort(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : fallback;
}
