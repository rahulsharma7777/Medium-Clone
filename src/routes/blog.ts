import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import { z } from "zod";
const createBlogInput = z.object({
  title: z.string(),
  content: z.string(),
});

export const updateBlogInput = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
});

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const header = c.req.header("Authorization");
    if(!header || !header.startsWith('Bearer '))
    {
        c.status(401);  
        return c.json({
         error:"Unauthorized"
        })
    }
    const token = header.split(" ")[1];
    const response = await verify(token, c.env.JWT_SECRET);

    if (!response || typeof response !== "object" || typeof response.id !== "string") {
        c.status(401);
        return c.json({
            error: "Unauthorized"
        });
    }
    c.set("userId", response.id as string);
    await next();


});
