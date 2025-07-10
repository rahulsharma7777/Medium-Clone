import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  },
  variables:{
    userId: string;
  }
}>();

app.use('/api/v1/blog/*', async(c,next)=>{
  const header =c.req.header('authorization') ||"";
  const token =header.split('')[1];
  const response=await verify(token,c.env.JWT_SECRET)
    if(response.id)
    {
      // Store userId in context variable
      c.set('jwtPayload',  response.id );
     await  next();
    }
    else{
      c.status(403)
      return c.json({error:"unauthorized"})
    }
})
// Signup route




// Signin route
app.post("/api/v1/signin", async (c) => {
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
    where: { email: body.email,
          password:body.password
     },
  });

  if (!user) {
    c.status(403);
    return c.json({ error: "User Not Found" });
  }

  const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
  return c.json({ jwt });
});

// Blog routes
app.post("/api/v1/blog", (c) => c.text("Hello Hono!"));
app.get("/api/v1/blog", (c) => c.text("Hello Hono!"));
app.get("/api/v1/blog/:blog", (c) => c.text("Hello Hono!"));

export default app;
