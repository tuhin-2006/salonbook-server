import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { ENV } from "../config/env";
import { User, IUser } from "../models/User";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  userId: string;
  role: string;
  email: string;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new ApiError(401, "Authentication required. Please log in.")
      );
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(
        new ApiError(401, "The user belonging to this token no longer exists.")
      );
    }

    if (user.isBlocked) {
      return next(
        new ApiError(
          403,
          "Your account has been suspended. Please contact customer support."
        )
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
