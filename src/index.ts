import { Hono } from "hono";

const app = new Hono();

app.post("/api/vi/signup", (c) => {
  return c.text("Hello Hono!");
});
app.post("/api/vi/sigin", (c) => {
  return c.text("Hello Hono!");
});
app.post("/api/vi/blog", (c) => {
  return c.text("Hello Hono!");
});
app.get("/api/vi/blog", (c) => {
  return c.text("Hello Hono!");
});
app.get("/api/vi/blog/:blog", (c) => {
  return c.text("Hello Hono!");
});
export default app;
