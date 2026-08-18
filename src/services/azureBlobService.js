import { BlobServiceClient } from "@azure/storage-blob";
import { Readable } from "stream";

let blobServiceClient = null;
let containerClient = null;

/**
 * Initialize Azure Blob Storage client
 * Called on server startup if AZURE_STORAGE_CONNECTION_STRING is set
 */
export function initializeAzureBlobStorage() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER || "uploads";

  if (!connectionString) {
    console.warn(
      "AZURE_STORAGE_CONNECTION_STRING not set. Using local uploads.",
    );
    return false;
  }

  try {
    blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
    console.log(`Azure Blob Storage initialized. Container: ${containerName}`);
    return true;
  } catch (error) {
    console.error("Failed to initialize Azure Blob Storage:", error.message);
    return false;
  }
}

/**
 * Upload a file to Azure Blob Storage
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} fileName - Name of the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} - Public URL of the uploaded blob
 */
export async function uploadFileToBlob(fileBuffer, fileName, mimeType) {
  if (!containerClient) {
    throw new Error("Azure Blob Storage not initialized");
  }

  try {
    const blobClient = containerClient.getBlockBlobClient(fileName);

    // Upload file
    await blobClient.upload(fileBuffer, fileBuffer.byteLength, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });

    // Return public URL
    return blobClient.url;
  } catch (error) {
    console.error("Error uploading to Azure Blob Storage:", error.message);
    throw new Error(`Failed to upload file to blob storage: ${error.message}`);
  }
}

/**
 * Download a file from Azure Blob Storage
 * @param {string} fileName - Name of the blob
 * @returns {Promise<Buffer>} - File content as buffer
 */
export async function downloadFileFromBlob(fileName) {
  if (!containerClient) {
    throw new Error("Azure Blob Storage not initialized");
  }

  try {
    const blobClient = containerClient.getBlockBlobClient(fileName);
    const downloadBlockBlobResponse = await blobClient.download(0);
    return await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
  } catch (error) {
    console.error("Error downloading from Azure Blob Storage:", error.message);
    throw new Error(
      `Failed to download file from blob storage: ${error.message}`,
    );
  }
}

/**
 * Delete a file from Azure Blob Storage
 * @param {string} fileName - Name of the blob to delete
 */
export async function deleteFileFromBlob(fileName) {
  if (!containerClient) {
    throw new Error("Azure Blob Storage not initialized");
  }

  try {
    const blobClient = containerClient.getBlockBlobClient(fileName);
    await blobClient.delete();
  } catch (error) {
    console.error("Error deleting from Azure Blob Storage:", error.message);
    throw new Error(
      `Failed to delete file from blob storage: ${error.message}`,
    );
  }
}

/**
 * Check if Azure Blob Storage is enabled
 * @returns {boolean}
 */
export function isAzureBlobEnabled() {
  return !!containerClient;
}

/**
 * Helper: Convert readable stream to buffer
 */
function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => chunks.push(data));
    readableStream.on("end", () => resolve(Buffer.concat(chunks)));
    readableStream.on("error", reject);
  });
}
