import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ENV } from "../config/env";
import { USER_ROLES } from "../constants";
import { AuthenticatedRequest } from "../middlewares/auth";
import { uploadToImgBB } from "../services/imgbb.service";

const generateToken = (userId: string, role: string, email: string): string => {
  return jwt.sign({ userId, role, email }, ENV.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, image } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  // Security: Enforce CUSTOMER role on public registration
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone: phone || "",
    image: image || "",
    role: USER_ROLES.CUSTOMER,
    isBlocked: false,
  });

  const token = generateToken(user._id.toString(), user.role, user.email);

  res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          image: user.image,
          createdAt: user.createdAt,
        },
        token,
      },
      "Account registered successfully."
    )
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );
  if (!user || !user.password) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (user.isBlocked) {
    throw new ApiError(
      403,
      "Your account has been suspended. Please contact customer support."
    );
  }

  const token = generateToken(user._id.toString(), user.role, user.email);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          image: user.image,
          createdAt: user.createdAt,
        },
        token,
      },
      "Logged in successfully."
    )
  );
});

export const getMe = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated.");
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            phone: req.user.phone,
            image: req.user.image,
            createdAt: req.user.createdAt,
          },
        },
        "User profile retrieved successfully."
      )
    );
  }
);

export const updateProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated.");
    }

    const { name, phone, image } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(image !== undefined && { image }),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          user: updatedUser,
        },
        "Profile updated successfully."
      )
    );
  }
);

export const uploadAvatar = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, "Please upload an image file.");
    }

    const imageUrl = await uploadToImgBB(
      req.file.buffer,
      req.file.originalname || "avatar.jpg"
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          url: imageUrl,
        },
        "Image uploaded successfully."
      )
    );
  }
);
