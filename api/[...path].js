const bundledModule = require("../concordia/artifacts/api-server/dist/vercel.cjs");
const app = bundledModule.default || bundledModule;

module.exports = (req, res) => {
  const url = req.url || "/";
  const [pathname, query = ""] = url.split("?", 2);

  if (pathname !== "/api" && !pathname.startsWith("/api/")) {
    const apiPath = pathname === "/" ? "" : pathname;
    req.url = `/api${apiPath}${query ? `?${query}` : ""}`;
  }

  return app(req, res);
};