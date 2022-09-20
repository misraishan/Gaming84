import { db } from "..";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { randomInt } from "crypto";

let config: any;

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
  const gameList = await db.userGame.findMany({
    where: { userId: user },
    include: { game: true },
  });

  if (gameList[0].userId == undefined) throw Error("Not in db");

  const labels: string[] = [];
  const data: string[] = [];

  gameList.forEach((game) => {
    labels.push(game.game.name);
    data.push(game.time);
  });

  config = {
    type: "doughnut",
    data: getData(labels, data),
    options: {
      devicePixelRatio: 1,
      animation: false,
      events: [],
      responsive: false,
    },
  };

  const width = 400; //px
  const height = 400; //px
  const backgroundColour = "White"; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
  const chart = new ChartJSNodeCanvas({ width, height, backgroundColour });

  const image = await chart.renderToBuffer(config);

  return { image, gameList, error: null };
}
