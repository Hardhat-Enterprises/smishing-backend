import app from "./app.js";

/* ====================================================================== */
/* 8) SERVER BOOT                                                         */
/* ====================================================================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});