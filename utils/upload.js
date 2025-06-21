// server/utils/upload.js
//import cloudinary from '../config/cloudinary.js';

// utils/upload.js
import cloudinary from "cloudinary";
import fs from "fs";

cloudinary.v2.config({
  cloud_name: "dr7thzxwl",
  api_key: "756574152586552",
  api_secret: "y235v56HWXHd-V5102B7RKcST7g",
});

// ✅ FIXED: Accept tempFilePath as string
export const uploadToCloudinary = async (tempFilePath, folder = "employees") => {
  try {
    if (!tempFilePath || typeof tempFilePath !== "string") {
      throw new Error("Invalid file data");
    }

    const result = await cloudinary.v2.uploader.upload(tempFilePath, {
      folder,
      resource_type: "auto",
    });

    fs.unlinkSync(tempFilePath); // delete temp file
    return result;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw new Error("Cloudinary upload error: " + err.message);
  }
};



export const deleteFromCloudinary = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    throw new Error(`Cloudinary delete error: ${error.message}`);
  }
};
