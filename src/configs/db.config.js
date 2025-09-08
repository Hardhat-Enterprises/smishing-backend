import mongoose from "mongoose";

async function connectDB() {
    try {
        const uri =
            "mongodb+srv://thakurraghav2004:5211325703@cluster0.3e5ifeh.mongodb.net/smishingDB?retryWrites=true&w=majority&appName=Cluster0";
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
