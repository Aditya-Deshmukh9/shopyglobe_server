import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
    console.log(
      `MongoDB connected || DB Host ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log(`MONGODB connection FAILED`, error);
    process.exit(1);
  }
};
