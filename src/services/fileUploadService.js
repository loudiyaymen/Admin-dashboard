import { uploadFileToBlob, isAzureBlobEnabled } from "./azureBlobService.js";
import path from "node:path";
import fs from "node:fs";

/**
 * Process uploaded file and store it (Azure Blob or local)
 * @param {Object} file - Multer file object
 * @param {string} prefix - Optional prefix for blob name (e.g., "reports", "events")
 * @returns {Promise<string>} - URL or path to the stored file
 */
export async function processAndStoreFile(file, prefix = "") {
  if (!file) {
    return null;
  }

  try {
    // Use timestamp + random suffix to avoid collisions
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    const blobName = `${prefix ? prefix + "/" : ""}${timestamp}-${randomSuffix}${ext}`;

    // If Azure Blob Storage is enabled, upload to cloud
    if (isAzureBlobEnabled()) {
      console.log(`Uploading ${blobName} to Azure Blob Storage...`);
      const url = await uploadFileToBlob(file.buffer, blobName, file.mimetype);
      console.log(`File uploaded successfully: ${url}`);
      return url;
    }

    // Fallback: Save to local disk
    console.log(
      `Azure Blob Storage not available. Saving ${blobName} locally...`,
    );
    const uploadsDir = path.resolve(process.cwd(), "uploads", prefix);
    fs.mkdirSync(uploadsDir, { recursive: true });

    const localPath = path.join(
      uploadsDir,
      `${timestamp}-${randomSuffix}${ext}`,
    );
    fs.writeFileSync(localPath, file.buffer);

    // Return relative URL path
    const urlPath = prefix
      ? `/uploads/${prefix}/${timestamp}-${randomSuffix}${ext}`
      : `/uploads/${timestamp}-${randomSuffix}${ext}`;
    return urlPath;
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
}
