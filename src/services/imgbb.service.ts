import axios from "axios";
import FormData from "form-data";
import { ENV } from "../config/env";
import { ApiError } from "../utils/ApiError";

export const uploadToImgBB = async (
  imageBuffer: Buffer,
  fileName = "upload.jpg"
): Promise<string> => {
  if (!ENV.IMGBB_API_KEY) {
    throw new ApiError(500, "ImgBB API key is not configured on the server.");
  }

  const formData = new FormData();
  formData.append("image", imageBuffer, { filename: fileName });

  try {
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${ENV.IMGBB_API_KEY}`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    if (response.data && response.data.data && response.data.data.url) {
      return response.data.data.url as string;
    }

    throw new ApiError(500, "Failed to parse image URL from ImgBB response.");
  } catch (error) {
    console.error("[ImgBB Service Error]:", error);
    throw new ApiError(500, "Failed to upload image to ImgBB.");
  }
};
