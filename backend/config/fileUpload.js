import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";
config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fileTypes = {
  image: {
    resource_type: "image",
    folder: "whatsapp-clone/images",
    fileSize: 10 * 1024 * 1024,
  },
  video: {
    resource_type: "video",
    folder: "whatsapp-clone/videos",
    fileSize: 100 * 1024 * 1024,
  },
  audio: {
    resource_type: "video",
    folder: "whatsapp-clone/audio",
    fileSize: 30 * 1024 * 1024,
  },
  application: {
    resource_type: "raw",
    folder: "whatsapp-clone/documents",
    fileSize: 50 * 1024 * 1024,
  },
  text: {
    resource_type: "raw",
    folder: "whatsapp-clone/documents",
    fileSize: 50 * 1024 * 1024,
  },
  other: {
    resource_type: "raw",
    folder: "whatsapp-clone/other",
    fileSize: 100 * 1024 * 1024,
  },
};

const storage = multer.memoryStorage();
const limits = { fileSize: 100 * 1024 * 1024 };

export const uploadMiddleware = multer({ storage, limits });

export const handleSingleFileUpload = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const mimePrefix = req.file.mimetype.split("/")[0];
    const fileType = fileTypes[mimePrefix] || fileTypes.other;

    if (req.file.size > fileType.fileSize) {
      return res.status(413).json({
        error: `File too large. Max size: ${
          fileType.fileSize / (1024 * 1024)
        }MB`,
      });
    }

    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        resource_type: fileType.resource_type,
        folder: fileType.folder,
      }
    );

    req.uploadedFile = {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: fileType.resource_type,
      format: result.format,
      mimeType: req.file.mimetype,
      size: req.file.size,
      originalName: req.file.originalname,
    };

    next();
  } catch (error) {
    console.error("Single file upload error:", error);
    res
      .status(500)
      .json({ error: "File upload failed", details: error.message });
  }
};

export const handleMultipleFileUpload = async (req, res, next) => {
  const files = req.files;
  if (!files || files.length === 0) return next();

  try {
    const uploadPromises = files.map(async (file) => {
      const mimePrefix = file.mimetype.split("/")[0];
      const fileType = fileTypes[mimePrefix] || fileTypes.other;

      if (file.size > fileType.fileSize) {
        throw new Error(
          `File "${file.originalname}" too large. Max size: ${
            fileType.fileSize / (1024 * 1024)
          }MB`
        );
      }

      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        {
          resource_type: fileType.resource_type,
          folder: fileType.folder,
        }
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: fileType.resource_type,
        format: result.format,
        mimeType: file.mimetype,
        size: file.size,
        originalName: file.originalname,
      };
    });

    const results = await Promise.allSettled(uploadPromises);
    const successful = [];
    const failed = [];

    results.forEach((res, i) => {
      if (res.status === "fulfilled") {
        successful.push(res.value);
      } else {
        failed.push({
          file: files[i].originalname,
          error: res.reason.message,
        });
      }
    });

    req.uploadedFiles = {
      successful,
      failed,
      total: files.length,
      successCount: successful.length,
      failureCount: failed.length,
    };

    next();
  } catch (error) {
    console.error("Multiple file upload error:", error);
    res
      .status(500)
      .json({ error: "File upload failed", details: error.message });
  }
};

export const upload = {
  single: (fieldName = "file") => [
    uploadMiddleware.single(fieldName),
    handleSingleFileUpload,
  ],
  multiple: (fieldName = "files", maxCount = 10) => [
    uploadMiddleware.array(fieldName, maxCount),
    handleMultipleFileUpload,
  ],
};
