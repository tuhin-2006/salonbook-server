import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { ApiError } from "../utils/ApiError";
import { USER_ROLES, UserRole } from "../constants";

export const authorize = (...roles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(new ApiError(401, "User is not authenticated"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "Access denied. You do not have permission to perform this action."
        )
      );
    }

    next();
  };
};

export const requireAdmin = authorize(USER_ROLES.ADMIN);
export const requireCustomer = authorize(USER_ROLES.CUSTOMER, USER_ROLES.ADMIN);
export const requireCustomerOnly = authorize(USER_ROLES.CUSTOMER);
