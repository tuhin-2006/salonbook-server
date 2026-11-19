import { Response } from "express";
import { User } from "../models/User";
import { Appointment } from "../models/Appointment";
import { Transaction } from "../models/Transaction";
import { Service } from "../models/Service";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middlewares/auth";
import { TRANSACTION_STATUS, USER_ROLES } from "../constants";

export const getAnalytics = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response) => {
    const [
      totalUsers,
      totalAppointments,
      totalServices,
      totalRevenueResult,
      statusCounts,
      categoryDistribution,
    ] = await Promise.all([
      User.countDocuments({ role: USER_ROLES.CUSTOMER }),
      Appointment.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Transaction.aggregate([
        { $match: { status: TRANSACTION_STATUS.SUCCEEDED } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Appointment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Service.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue =
      totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = await Transaction.aggregate([
      { $match: { status: TRANSACTION_STATUS.SUCCEEDED } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 },
    ]);

    const formattedMonthly = monthlyRevenue.map((item) => {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      return {
        month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        revenue: item.revenue,
        bookings: item.count,
      };
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          summary: {
            totalUsers,
            totalAppointments,
            totalServices,
            totalRevenue,
          },
          statusCounts,
          categoryDistribution,
          monthlyRevenue: formattedMonthly,
        },
        "Analytics data retrieved successfully."
      )
    );
  }
);

export const getUsers = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response) => {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json(
      new ApiResponse(200, users, "Users retrieved successfully.")
    );
  }
);

export const getUserById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const [appointmentsCount, recentAppointments] = await Promise.all([
      Appointment.countDocuments({ customerId: id }),
      Appointment.find({ customerId: id })
        .populate("serviceId", "title category price durationMinutes images")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          user,
          appointmentsCount,
          recentAppointments,
        },
        "User dossier retrieved successfully."
      )
    );
  }
);

export const blockUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (req.user && req.user._id.toString() === id) {
      throw new ApiError(400, "You cannot block your own administrative account.");
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      throw new ApiError(404, "User not found.");
    }

    if (targetUser.role === USER_ROLES.ADMIN) {
      throw new ApiError(403, "Cannot block an administrator.");
    }

    targetUser.isBlocked = true;
    await targetUser.save();

    res.status(200).json(
      new ApiResponse(200, targetUser, "User has been suspended successfully.")
    );
  }
);

export const unblockUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      throw new ApiError(404, "User not found.");
    }

    targetUser.isBlocked = false;
    await targetUser.save();

    res.status(200).json(
      new ApiResponse(200, targetUser, "User has been unblocked successfully.")
    );
  }
);
