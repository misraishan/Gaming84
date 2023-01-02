import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function migrateUpdatedAt() {
    const users = await db.user.findMany();

    for (const user of users) {
        await db.user.update({
            where: { id: user.id },
            data: { updatedAt: new Date(2022, 11, 31, 11, 59, 59, 999) },
        });
    }

    console.log("Done!");

    process.exit(0);
}

migrateUpdatedAt();