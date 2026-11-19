import axios from "axios";
import FormData from "form-data";
import { ENV } from "../config/env";
import { ApiError } from "../utils/ApiError";

export const uploadToImgBB = async (
  imageBuffer: Buffer,
  fileName = "upload.jpg"
): Promise<string> => {
  if (!ENV.IMGBB_API_KEY || ENV.IMGBB_API_KEY.includes("your_imgbb")) {
    console.warn(
      "[ImgBB Service] IMGBB_API_KEY is not configured or using placeholder. Returning high-res placeholder."
    );
    return "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";
  }

  const formData = new FormData();
  formData.append("image", imageBuffer, { filename: fileName });

  try {
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${ENV.IMGBB_API_KEY}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        },
        timeout: 20000,
      }
    );

    const imageUrl =
      response.data?.data?.display_url || response.data?.data?.url;

    if (imageUrl) {
      console.log(`[ImgBB Service] Successfully uploaded image: ${imageUrl}`);
      return imageUrl as string;
    }

    throw new ApiError(500, "Failed to parse image URL from ImgBB response.");
  } catch (error) {
    console.error("[ImgBB Service Error]:", error);
    throw new ApiError(500, "Failed to upload image to ImgBB.");
  }
};
