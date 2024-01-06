import { db } from "..";

export class allTimeStats {
  static async getStats(id: string) {
    const stats = await db.allTimeStats.findFirst({
      where: {
        userId: id,
      },
    });
  }

  static async updateStats(id: string, data: any) {
    const stats = await db.allTimeStats.findFirst({ where: { userId: id } });
    const game = data["game"];
    const time = data["time"];

    if (!stats) {
      await db.allTimeStats.create({
        data: {
          userId: id,
          games: [{ [game]: time }] as any,
          time: time,
        },
      });
    } else {
      const games = stats.games as any;
      games.map((val: any) => {
        if (val[game]) {
          val[game] += time;
        } else {
          val[game] = time;
        }
      });
      await db.allTimeStats.update({
        where: {
          userId: id,
        },
        data: {
          games: [...(stats.games as any)] as any,
          time: BigInt(stats.time) + BigInt(time),
        },
      });
    }

    return;
  }
}
