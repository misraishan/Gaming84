import { appwriteStore } from "..";
import fs from "node:fs/promises";
import { unlinkSync } from "node:fs";
import { InputFile } from "node-appwrite";

export default class storageAPI {
  static async createBucket(name: string) {
    try {
      const bucket = await appwriteStore.createBucket(name, name);
      return bucket.$id;
    } catch (error) {
      console.log("Time is: " + Date.now() + "\nError is: \n" + error);
      return false;
    }
  }

  static async uploadMonthlyUpdate(
    bucketID: string,
    name: string,
    file: string
  ) {
    try {
      await appwriteStore.getBucket(bucketID);
    } catch (error: any) {
      if (error["code"] === 404) {
        await this.createBucket(bucketID);
      } else {
        console.log("Time is: " + Date.now() + "\nError is: \n" + error);
        return;
      }
    }

    const tempFile = await fs.writeFile
      .call(fs, name, file)
      .then(() => {
        return name;
      })
      .catch((error) => {
        console.log("Error is: " + error);
        return false;
      });

    try {
      const res = await appwriteStore.createFile(
        bucketID,
        name,
        InputFile.fromPath(tempFile.toString(), name)
      );
      unlinkSync(name);
      return true;
    } catch (error) {
      console.log("Time is: " + Date.now() + "\nError is: \n" + error);
      return false;
    }
  }

  static async readMonthlyRecap(bucketID: string, name: string) {
    try {
      const file = await appwriteStore.getFileView(bucketID, name);
      return file;
    } catch (error) {
      console.log("Time is: " + Date.now() + "\nError is: \n" + error);
      return { error: "File not found" };
    }
  }
}
