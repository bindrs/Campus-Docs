const bundledModule = require("../artifacts/api-server/dist/vercel.cjs");
const app = bundledModule.default || bundledModule;

module.exports = (req, res) => {
  const url = req.url || "/";
  const [pathname, query = ""] = url.split("?", 2);

  // Vercel may pass the path with or without the /api prefix.
  if (pathname !== "/api" && !pathname.startsWith("/api/")) {
    const apiPath = pathname === "/" ? "" : pathname;
    req.url = `/api${apiPath}${query ? `?${query}` : ""}`;
  }

  return app(req, res);
};