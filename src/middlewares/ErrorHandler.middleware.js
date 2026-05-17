export const errorHandler = (err, req, res, next) => {
    // Update this for any specific errors unhandled by
    // the global error handler
    // .....

    // This handles specific URIError
    if (err instanceof URIError) {
        console.error("A URIError has occured:", err.message);
        return res.status(400).json({ message: "URL contains invalid characters, please try again" });
    }

    // This is the global error handler
    // handles error in most cases
    console.error("Unexpected Error:", err.stack);
    return res
        .status(500)
        .json({ message: "An unexpected error occured, please try again later or contact customer support" });
};
