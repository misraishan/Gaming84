import { Express } from "express";
import { db, recentUsers } from "..";

export function dbApi(app: Express) {
  app.get("/api/", async (req, res) => {
    res.send({ Hello: "World!" });
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
    const games = await db.game.findMany({});
    res.send(games);
  });

  app.get("/api/games/top", async (req, res) => {
    const games = await db.game.findMany({
      orderBy: { UserGame: { _count: "desc" } },
      take: 10,
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
    const user = await db.user.findFirst({ where: { id: req.params.userid } });
    const currentGame = recentUsers.get(req.params.userid);
    res.send({ ...user, currentGame });
  });

  app.get("/api/users/:userid/games", async (req, res) => {
    const games = await db.userGame.findMany({
      where: { userId: req.params.userid },
      include: { game: true },
      orderBy: { time: "desc" },
      take: 10,
    });
    res.send([...games]);
  });

  app.get("/api/users/:userid/games/:gameid", async (req, res) => {
    const game = await db.userGame.findFirst({
      where: { userId: req.params.userid, gameId: parseInt(req.params.gameid) },
    });
    res.send(game);
  });
}
