import mongoose from "mongoose";

async function connectDB() {
    try {
        const uri =
            "mongodb+srv://<username>:<password>@cluster0.xyz.mongodb.net/smishingDB?retryWrites=true&w=majority";
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(" Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit if database connection fails
    }
}

export default connectDB;
