import { db } from "..";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { randomInt } from "crypto";
import { Chart } from "chart.js";

function getData(labels: string[], data: string[]) {
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

export async function generateDonut(user: string) {
  let gameList = await db.userGame.findMany({
    where: { userId: user },
    include: { game: true },
    orderBy: { time: "desc" },
  });

  if (gameList[0].userId == undefined) throw Error("Not in db");

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

  gameList.forEach((game) => {
    labels.push(game.game.name);
    data.push(game.time.toString());
  });

  const config: any = {
    type: "pie",
    data: getData(labels, data),
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

  return { image, gameList, error: null };
}
