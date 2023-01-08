import { db } from "..";
import storageAPI from "../api/appwriteStore";

export async function createGame(name: string) {
  const game = await db.game.create({ data: { name } });
  return game;
}

export async function updateUserGame(
  userGameId: number,
  originalTime: number,
  time: number,
  userId: string
) {
  const newTime = originalTime + Math.floor((Date.now() - time) / 1000);

  const user = await db.user.findFirst({ where: { id: userId } });
  const date = new Date();
  let userGame;

  if (
    user &&
    (user?.updatedAt?.getMonth() !== date.getMonth() ||
      user?.updatedAt.getFullYear() !== date.getFullYear())
  ) {
    const games = await db.userGame.findMany({
      where: { userId },
      include: { game: true },
    });

    const bucketID = `${user.updatedAt.getFullYear()}-${user.updatedAt.getMonth() + 1}`;
    const fileName = `${user.id}-${user.updatedAt.getFullYear()}-${user.updatedAt.getMonth() + 1}.json`;

    await storageAPI.uploadMonthlyUpdate(
      bucketID,
      fileName,
      JSON.stringify(games),
    );

    const originalGame = await db.userGame.findFirst({
      where: { id: userGameId },
      include: { game: true },
    });

    await db.userGame.deleteMany({ where: { userId } });

    if (originalGame) {
      userGame = await db.userGame.create({
        data: {
          time: Math.floor((Date.now() - time) / 1000),
          userId,
          gameId: originalGame?.game.id,
        },
        include: { game: true, user: true },
      });
    }
  } else {
    userGame = await db.userGame.update({
      where: { id: userGameId },
      data: { time: newTime },
      include: { user: true, game: true },
    });
  }

  await db.user.update({
    where: { id: userGame?.user.id },
    data: {
      lastPlayedTime: Math.floor((Date.now() - time) / 1000),
      lastPlayedGame: userGame?.game.name,
    },
  });
}

export async function createUserGame(
  userId: string,
  gameId: number,
  time: number
) {
  const newTime = Math.floor((Date.now() - time) / 1000);

  const user = await db.user.findFirst({ where: { id: userId } });
  const date = new Date();

  if (
    user &&
    (user?.updatedAt?.getMonth() !== date.getMonth() ||
      user?.updatedAt.getFullYear() !== date.getFullYear())
  ) {
    const games = await db.userGame.findMany({
      where: { userId },
      include: { game: true },
    });

    const bucketID = `${user.updatedAt.getFullYear()}-${user.updatedAt.getMonth() + 1}`;
    const fileName = `${user.id}-${user.updatedAt.getFullYear()}-${user.updatedAt.getMonth() + 1}.json`;

    await storageAPI.uploadMonthlyUpdate(
      bucketID,
      fileName,
      JSON.stringify(games),
    );

    await db.userGame.deleteMany({ where: { userId } });
  }

  const userGame = await db.userGame.create({
    data: {
      userId,
      gameId,
      time: newTime,
    },
    include: { user: true, game: true },
  });

  await db.user.update({
    where: { id: userId },
    data: { lastPlayedGame: userGame.game.name, lastPlayedTime: newTime },
  });
  return userGame;
}
