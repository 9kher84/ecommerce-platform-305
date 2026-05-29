import Tesseract from "tesseract.js";

/**
 * 🛠️ Sovereign Invoice OCR Utility (Client-side)
 * Uses Tesseract.js to extract text from invoices without sending images to the server.
 */
export const extractInvoiceText = async (imageFile) => {
  try {
    console.log("🛡️ Sovereign OCR: Starting extraction on client-side...");

    // 1. Initialize Tesseract Worker
    const {
      data: { text },
    } = await Tesseract.recognize(
      imageFile,
      "ara+eng", // Support Arabic and English
      { logger: (m) => console.log(m) },
    );

    console.log("✅ Extraction complete. Sending text to secure endpoint...");
    return text;
  } catch (error) {
    console.error("❌ OCR Error:", error);
    throw new Error("Failed to extract text from invoice.");
  }
};

/**
 * Send extracted text to backend
 */
export const saveInvoiceText = async (id, text, type = "deal") => {
  const endpoint = `/api/invoice/extract-text`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, text, type }),
  });

  return await response.json();
};
