import http from "http";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = http.createServer((req, res) => {
  const url = req.url || "/";
  if (req.method === "GET" && (url === "/health" || url === "/ready")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "GET" && url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Robby service alive");
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Robby server listening on port ${PORT}`);
});
