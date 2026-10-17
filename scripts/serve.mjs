import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../out/", import.meta.url));
const port = Number(process.env.PORT || 3187);
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};
const server = createServer(async (req, res) => {
  try {
    const requestPath = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (
      basePath &&
      requestPath !== basePath &&
      !requestPath.startsWith(`${basePath}/`)
    )
      throw new Error("Outside base path");
    const pathname = requestPath.slice(basePath.length) || "/";
    let file = path.resolve(root, `.${pathname}`);
    if (
      file !== path.resolve(root) &&
      !file.startsWith(path.resolve(root) + path.sep)
    )
      throw new Error("Outside export");
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const content = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    try {
      res.end(await readFile(path.join(root, "404.html")));
    } catch {
      res.end("Build the site first with npm run build.");
    }
  }
});
server.listen(port, "0.0.0.0", () =>
  console.log(
    `GuardianWAF static preview: http://localhost:${server.address().port}${basePath}/`,
  ),
);
