import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import { v4 as uuidv4 } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXPORTS_DIR = path.join(__dirname, "../../exports");
if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

export const generatePDF = async (reports, options = {}) => {
    const fileName = `report-${uuidv4()}.pdf`;
    const filePath = path.join(EXPORTS_DIR, fileName);

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // Add title
            doc.fontSize(20).text("Reports Export", { align: "center" });
            doc.moveDown();
            doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
            doc.moveDown(2);

            // Add reports
            reports.forEach((report, index) => {
                doc.fontSize(14).text(`Report #${index + 1}`);
                doc.moveDown(0.5);
                doc.fontSize(12).text(`Type: ${report.type}`);
                doc.fontSize(12).text(`Status: ${report.status}`);
                doc.fontSize(12).text(`Created: ${new Date(report.createdAt).toLocaleString()}`);
                doc.moveDown(0.5);
                doc.fontSize(10).text(`Content: ${report.content}`);

                if (report.additionalInfo && Object.keys(report.additionalInfo).length) {
                    doc.moveDown(0.5);
                    doc.fontSize(10).text("Additional Information:");
                    Object.entries(report.additionalInfo).forEach(([key, value]) => {
                        doc.fontSize(10).text(`${key}: ${JSON.stringify(value)}`);
                    });
                }

                if (index < reports.length - 1) {
                    doc.moveDown();
                    doc.strokeColor("#aaaaaa")
                        .lineWidth(0.5)
                        .moveTo(72, doc.y)
                        .lineTo(doc.page.width - 72, doc.y)
                        .stroke();
                    doc.moveDown();
                }
            });

            // Finalize the PDF
            doc.end();

            stream.on("finish", () => {
                resolve({ filePath, fileName });
            });

            stream.on("error", (error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};

export const generateCSV = async (reports, options = {}) => {
    const fileName = `report-${uuidv4()}.csv`;
    const filePath = path.join(EXPORTS_DIR, fileName);

    return new Promise((resolve, reject) => {
        try {
            const fields = ["id", "type", "content", "status", "createdAt", "sourceId", "sourceType", "additionalInfo"];

            // Prepare data for CSV conversion
            const data = reports.map((report) => {
                return {
                    id: report._id.toString(),
                    type: report.type,
                    content: report.content,
                    status: report.status,
                    createdAt: new Date(report.createdAt).toISOString(),
                    sourceId: report.sourceId || "",
                    sourceType: report.sourceType || "",
                    additionalInfo: JSON.stringify(report.additionalInfo || {}),
                };
            });

            // Generate CSV
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(data);

            // Write to file
            fs.writeFileSync(filePath, csv);

            resolve({ filePath, fileName });
        } catch (error) {
            reject(error);
        }
    });
};

export const cleanupExportedFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error("Error cleaning up exported file:", error);
    }
};
