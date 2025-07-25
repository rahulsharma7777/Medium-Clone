import { Hono } from "hono";
import { userRouter } from "./routes/users";
import { blogRouter } from "./routes/blog";
import { cors } from "hono/cors";

const app = new Hono();
app.use('/*',cors());
app.route('/api/v1/user',userRouter);
app.route("/api/v!/blog",blogRouter)




export default app;
