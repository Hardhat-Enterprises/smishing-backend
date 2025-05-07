import https from "https";
import { URL } from "url";

const API_KEY = "AIzaSyAIzYNavyVnAVb-FJqb1pJgPLFTUQXsXig";
const CX = "5265009408d3748bb";

export const searchNews = async (req, res) => {
    try {
        const { query, limit = 10, offset = 1, sort = "date", dateRestrict = "m1", lang = "en" } = req.query;
        if (!query) {
            return res.status(401).json({
                success: false,
                message: "Search query is required.",
            });
        }

        const url = new URL("https://www.googleapis.com/customsearch/v1");
        url.searchParams.append("key", API_KEY);
        url.searchParams.append("cx", CX);
        url.searchParams.append("q", query);
        url.searchParams.append("num", limit);
        url.searchParams.append("sort", sort);
        url.searchParams.append("start", offset);
        url.searchParams.append("dateRestrict", dateRestrict);
        url.searchParams.append("hl", lang);
        url.searchParams.append("safe", "active");

        const data = await new Promise((resolve, reject) => {
            https
                .get(url, (response) => {
                    let data = "";

                    response.on("data", (chunk) => {
                        data += chunk;
                    });

                    response.on("end", () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(new Error("Failed to parse response"));
                        }
                    });
                })
                .on("error", (error) => {
                    reject(error);
                });
        });

        const results = data.items || [];

        return res.status(200).json({
            success: true,
            data: results,
            searchInformation: data.searchInformation,
        });
    } catch (error) {
        console.error("Error in news search:", error.message);

        if (error.message.includes("quota")) {
            return res.status(429).json({
                success: false,
                message: "API quota exceeded. Please try again later.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
