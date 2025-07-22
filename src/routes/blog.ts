import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import { z } from "zod";
import errorMap from "zod/locales/en.js";
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
  if (!header || !header.startsWith("Bearer ")) {
    c.status(401);
    return c.json({
      error: "Unauthorized",
    });
  }
  const token = header.split(" ")[1];
  const response = await verify(token, c.env.JWT_SECRET);

  if (
    !response ||
    typeof response !== "object" ||
    typeof response.id !== "string"
  ) {
    c.status(401);
    return c.json({
      error: "Unauthorized",
    });
  }
  c.set("userId", response.id as string);
  await next();
});

blogRouter.post("/createblog", async (c) => {
  try {
    const getPrisma = (env: any) =>
      new PrismaClient({
        datasources: {
          db: {
            url: env.DATABASE_URL,
          },
        },
      }).$extends(withAccelerate());
    const prisma = getPrisma(c.env);
    const body = await c.req.json();
    const { success } = createBlogInput.safeParse(body);
    if (!success) {
      c.status(411);
      return c.json({
        error: "Invalid Inputs",
      });
    }
    const { title, content } = body;

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        authorId: c.get("userId"),
      },
    });

    return c.json({
      id: blog.id,
    });
  } catch (error) {
    c.status(400);
    return c.json({
      error: "Error While creating blog",
    });
  }
});

blogRouter.put("/uploadblog", async (c) => {
  try {
    const getPrisma = (env: any) =>
      new PrismaClient({
        datasources: {
          db: {
            url: env.DATABASE_URL,
          },
        },
      }).$extends(withAccelerate());
    const prisma = getPrisma(c.env);
    const body = await c.req.json();
    const { success } = updateBlogInput.safeParse(body);
    if (!success) {
      c.status(411);
      return c.json({
        error: "Invalid Input",
      });
    }
    const {id ,title ,content}=body;
     const blog=await prisma.blog.update({
      where:{
          id,
          authorId:c.get('userId')
      },
        data:{
             title,
             content
        }
     });
     return c.text("Blog Updated")


  } catch (error) {
    c.status(400);
    return c.json({
      error:"Error While updating blog"
    })
  }
});
