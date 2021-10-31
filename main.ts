import { Application, Router, helpers } from "https://deno.land/x/oak/mod.ts";

const app = new Application();

// Logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

const getSource = async (filename: string) => {
  const file = await Deno.readTextFile(`./${filename}.json`);
  return JSON.parse(file);
}

const router = new Router();
router.get("/main/:chapter/:stage", async (ctx) => {
    const params = helpers.getQuery(ctx, { mergeParams: true });
    const chapter = +params.chapter;
    const stage = +params.stage;
    if (!chapter || !stage) {
      ctx.throw(404);
    }

    const source = await getSource('chapters');
    ctx.response.body = JSON.stringify(source[chapter - 1][stage]);
    ctx.response.headers.append('Access-Control-Allow-Origin', '*');
  })
  .get("/event/:key", async (ctx) => {
    const params = helpers.getQuery(ctx, { mergeParams: true });

    const evKey = params.key;
    const file = await Deno.readTextFile(`./${evKey}.json`);
    const source = JSON.parse(file);

    if (!source) {
      ctx.throw(404);
    }

    ctx.response.body = JSON.stringify(source);
    ctx.response.headers.append('Access-Control-Allow-Origin', '*');
  });

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
