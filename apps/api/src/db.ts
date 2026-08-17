import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDb(uri: string = config.mongoUri): Promise<void> {
  await mongoose.connect(uri);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
