import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// async function migrate() {
//   const currentUserGame = await db.userGame.findMany();

//   for (const userGame of currentUserGame) {
//     try {
//       await db.userGame.update({
//         where: { id: userGame.id },
//         data: {
//           times: Math.floor(parseInt(userGame.time / 1000)),
//         },
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   }
// }

// async function migrate() {
//   const currentUserGame = await db.userGame.findMany();
//   console.log(currentUserGame[0]);

//   for (const userGame of currentUserGame) {
//     try {
//       await db.userGame.update({
//         where: { id: userGame.id },
//         data: {
//           time: userGame.times,
//         },
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   }
// }

// migrate();
