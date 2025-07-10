import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";

import { z } from "zod";

export const signUpInput = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

export const signInInput = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createBlogInput = z.object({
  title: z.string(),
  content: z.string(),
});

export const updateBlogInput = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
});

export type SignUpInput = z.infer<typeof signUpInput>;
export type SignInInput = z.infer<typeof signInInput>;
export type CreateBlogInput = z.infer<typeof createBlogInput>;
export type UpdateBlogInput = z.infer<typeof updateBlogInput>;

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  variables: {
    userId: string;
  };
}>();

app.post("/signin", async (c) => {
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
  const user = await prisma.user.findUnique({
    where: { email: body.email, password: body.password },
  });

  if (!user) {
    c.status(403);
    return c.json({ error: "User Not Found" });
  }

  const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
  return c.json({ jwt });
});
app.post("/signup", async (c) => {
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
  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: body.password,
    },
  });

  const token = await sign({ id: user.id }, c.env.JWT_SECRET);
  return c.json({ jwt: token });
});

app.get("/userinfo", async (c) => {
  try {
    const header = c.req.header("Authorization");
    if (!header || !header.startsWith("Bearer")) {
      c.status(401);
      return c.json({
        error: c.json({
          error: "Uauthorized",
        }),
      });
    }
    const token = header.split(" ")[1];
    const response = await verify(token, c.env.JWT_SECRET) as { id: string };

    if (!response.id) {
        c.status(401)
        return c.json({error:"Unauthorized"})
    }
    const getPrisma = (env: any) =>
    new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
    }).$extends(withAccelerate());
     const prisma = getPrisma(c.env);
     const user =await prisma.user.findUnique({
        where: { id: response.id as string },
        select: {
            id: true,
            name: true,
            email: true,
        }
     })
  return c.json({user})

  } catch (error) {
       return c.json({ error: "Error while fetching user" });
  }
});
