import { db } from "..";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { randomInt } from "crypto";
import { Chart } from "chart.js";

function getData(labels: string[], data: string[]) {
  const randColors = [];
  for (let i = 0; i < labels.length; i++) {
    randColors.push(
      `rgb(${randomInt(256)}, ${randomInt(256)}, ${randomInt(256)})`
    );
  }
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
      gameId: -1
    });
  }

  gameList.forEach((game) => {
    labels.push(game.game.name);
    data.push(game.time.toString());
  });

  const config : any = {
    type: "doughnut",
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
  Chart.defaults.color = "White"
  const backgroundColour = "#2F3037";
  const chart = new ChartJSNodeCanvas({ width, height, backgroundColour });

  const image = await chart.renderToBuffer(config);

  return { image, gameList, error: null };
}
