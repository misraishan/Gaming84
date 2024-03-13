// This is incredibly hacky because the previous file is not modularized at all.
import { db, appwriteStore } from "../../../index";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { Chart } from "chart.js";

function getYearlyData(labels: string[], data: string[]) {
  const randColors = [
    "#5856d6",
    "#5ac8fa",
    "#ffcc00",
    "#78d237",
    "#007aff",
    "#22924f",
    "#9b59b6",
    "#ff9500",
    "#ff2d55",
  ].slice(0, data.length);

  return {
    labels,
    datasets: [
      {
        label: "Total game time",
        data: data,
        backgroundColor: randColors,
        hoverOffset: 4,
      },
    ],
  };
}

export async function generateYearlyDonut(user: string, year: string) {
  let gameList =
    new Date().getFullYear() == parseInt(year)
      ? await db.userGame.findMany({
          where: { userId: user },
          include: { game: true },
          orderBy: { time: "desc" },
        })
      : [];

  const appwriteGamesList = [];
  for (let i = 1; i <= 12; i++) {
    try {
      const appwriteGame = await appwriteStore.getFileDownload(
        `${year}-${i}`,
        `${user}-${year}-${i}.json`
      );

      // console.log(appwriteGame.toJSON());
      const data = Buffer.from(appwriteGame.toString()).toString();

      appwriteGamesList.push(JSON.parse(data));
    } catch (err) {
      // Do nothing
      //   console.log(err);
    }
  }

  // Combine the appwrite games list with the db games list
  appwriteGamesList.forEach((monthList: any) => {
    monthList.forEach((game: any) => {
      const gameIndex = gameList.findIndex((val: any) => {
        return val.game.name == game.game.name;
      });

      if (gameIndex == -1) {
        gameList.push({
          id: -1,
          time: game.time,
          game: {
            id: -1,
            name: game.game.name,
          },
          userId: "",
          gameId: -1,
        });
      } else {
        gameList[gameIndex].time += game.time;
      }
    });
  });

  if (gameList.length == 0 && appwriteGamesList.length == 0) {
    throw new Error("No games found");
  }

  //   Iterate through and combine all games into a gameMap
  let totalGameTime = 0;
  const gameMap = new Map<string, number>();
  gameList.forEach((game: any) => {
    totalGameTime += game.time;
    if (gameMap.has(game.game.name)) {
      gameMap.set(game.game.name, gameMap.get(game.game.name)! + game.time);
    } else {
      gameMap.set(game.game.name, game.time);
    }
  });

  const uniqueGameCount = gameMap.size;
  gameList = [];
  gameMap.forEach((value, key) => {
    gameList.push({
      id: -1,
      time: value,
      game: {
        id: -1,
        name: key,
      },
      userId: "",
      gameId: -1,
    });
  });

  gameList.sort((a: any, b: any) => {
    return b.time - a.time;
  });

  const labels: string[] = [];
  const data: string[] = [];

  let otherTime = 0;
  if (gameList.length > 9) {
    const otherGames = gameList.slice(8);
    gameList = gameList.slice(0, 8);

    otherGames.forEach((game) => {
      otherTime += game.time;
    });

    gameList.push({
      id: -1,
      time: otherTime,
      game: {
        id: -1,
        name: "Other",
      },
      userId: "",
      gameId: -1,
    });
  }

  gameList.forEach((game: any) => {
    labels.push(game.game.name);
    data.push(game.time.toString());
  });

  const config: any = {
    type: "pie",
    data: getYearlyData(labels, data),
    options: {
      devicePixelRatio: 1,
      animation: false,
      events: [],
      responsive: false,
    },
  };

  const width = 400;
  const height = 400;
  Chart.defaults.color = "#fff";
  const backgroundColour = "#2F3037";
  const chart = new ChartJSNodeCanvas({ width, height, backgroundColour });

  const image = await chart.renderToBuffer(config);

  return { image, gameList, error: null, totalGameTime, uniqueGameCount };
}
