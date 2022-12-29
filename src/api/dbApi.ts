import { Express } from "express";
import { db } from "..";

export function dbApi(app: Express) {
  app.get("/api/", async (req, res) => {
    res.send({"Hello": "World!"});
  });

  app.use(async (req, res, next) => {
    const apiKey = req.headers["authorization"];
    if (!apiKey) {
      res.status(401).send("No API key provided");
      return;
    } else if (apiKey !== process.env.API_KEY) {
      res.status(401).send("Invalid API key");
      return;
    }
    next();
  });

  app.get("/api/games", async (req, res) => {
    const games = await db.game.findMany({
      take: +100,
    });
    res.send(games);
  });

  app.get("/api/games/:id", async (req, res) => {
    const game = await db.game.findFirst({
      where: { id: Number(req.params.id) },
    });
    res.send(game);
  });

  app.get("/api/users/:userid", async (req, res) => {
    const user = await db.user.findFirst({
      where: { id: req.params.userid },
    });
    res.send(user);
  });

  app.get("/api/users/:userid/games", async (req, res) => {
    const games = await db.userGame.findMany({
      where: { userId: req.params.userid },
    });
    res.send(games);
  });

  app.get("/api/users/:userid/games/:gameid", async (req, res) => {
    const game = await db.userGame.findFirst({
      where: { userId: req.params.userid, gameId: parseInt(req.params.gameid) },
    });
    res.send(game);
  });
}
