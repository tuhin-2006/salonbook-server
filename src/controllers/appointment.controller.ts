import { Response } from "express";
import { Appointment } from "../models/Appointment";
import { Service } from "../models/Service";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middlewares/auth";
import { APPOINTMENT_STATUS, PAYMENT_STATUS, USER_ROLES } from "../constants";

export const ALL_SALON_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
];

export const checkAvailability = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { serviceId, date } = req.query;

    const startOfDay = new Date(date as string);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date as string);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      serviceId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: {
        $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED],
      },
    }).select("timeSlot");

    const bookedSlots = bookedAppointments.map((app) => app.timeSlot);
    const availableSlots = ALL_SALON_SLOTS.filter(
      (slot) => !bookedSlots.includes(slot)
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          date,
          allSlots: ALL_SALON_SLOTS,
          bookedSlots,
          availableSlots,
        },
        "Availability retrieved successfully."
      )
    );
  }
);

export const bookAppointment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required. Please sign in to book an appointment.");
    }

    if (req.user.role === USER_ROLES.ADMIN) {
      throw new ApiError(
        403,
        "Admins cannot submit customer appointment requests. Please use a patron account."
      );
    }

    if (req.user.role !== USER_ROLES.CUSTOMER) {
      throw new ApiError(
        403,
        "Only registered customers can submit appointment requests."
      );
    }

    const { serviceId, appointmentDate, timeSlot, notes } = req.body;

    const service = await Service.findById(serviceId);
    if (!service || service.isActive === false) {
      throw new ApiError(400, "Cannot book an inactive or archived service.");
    }

    const targetDate = new Date(appointmentDate);
    targetDate.setUTCHours(0, 0, 0, 0);

    // 1. Prevent duplicate active appointments for the service on the same date and slot
    const existingServiceBooking = await Appointment.findOne({
      serviceId,
      appointmentDate: targetDate,
      timeSlot,
      status: {
        $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED],
      },
    });

    if (existingServiceBooking) {
      throw new ApiError(
        409,
        "This time slot is already reserved for this service. Please choose another time slot."
      );
    }

    // 2. Prevent duplicate active appointments for the customer on the same date and slot
    const customerConflict = await Appointment.findOne({
      customerId: req.user._id,
      appointmentDate: targetDate,
      timeSlot,
      status: {
        $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED],
      },
    });

    if (customerConflict) {
      throw new ApiError(
        409,
        "You already have an active appointment scheduled for this date and time slot."
      );
    }

    // 3. Create appointment in appointments collection with default Pending and Unpaid statuses
    const appointment = await Appointment.create({
      customerId: req.user._id,
      serviceId: service._id,
      appointmentDate: targetDate,
      timeSlot,
      servicePrice: service.price,
      paymentStatus: PAYMENT_STATUS.UNPAID,
      status: APPOINTMENT_STATUS.PENDING,
      notes: notes || "",
    });

    res.status(201).json(
      new ApiResponse(
        201,
        appointment,
        "Appointment booking request submitted successfully. Awaiting salon confirmation."
      )
    );
  }
);

export const getMyAppointments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required.");
    }

    const appointments = await Appointment.find({ customerId: req.user._id })
      .populate("serviceId", "title category price durationMinutes images")
      .populate("transactionId", "amount status stripeSessionId createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json(
      new ApiResponse(
        200,
        appointments,
        "Customer appointments retrieved successfully."
      )
    );
  }
);

export const cancelAppointment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required.");
    }

    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      throw new ApiError(404, "Appointment not found.");
    }

    // Role verification: Customer can only cancel their own appointment
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      !appointment.customerId.equals(req.user._id)
    ) {
      throw new ApiError(
        403,
        "Access denied. You cannot cancel another user's appointment."
      );
    }

    // Customer Action Rule: Only allowed on pending appointments
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      appointment.status !== APPOINTMENT_STATUS.PENDING
    ) {
      throw new ApiError(
        400,
        "Only pending appointments can be cancelled. Confirmed appointments cannot be cancelled."
      );
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      throw new ApiError(400, "This appointment is already cancelled.");
    }

    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    appointment.cancelledAt = new Date();
    await appointment.save();

    res.status(200).json(
      new ApiResponse(
        200,
        appointment,
        "Appointment has been cancelled successfully."
      )
    );
  }
);

export const getAllAppointments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { status, page = "1", limit = "20" } = req.query;

    const query: Record<string, unknown> = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate("customerId", "name email phone image")
        .populate("serviceId", "title category price durationMinutes images")
        .populate("transactionId", "amount status stripeSessionId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Appointment.countDocuments(query),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          appointments,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        },
        "All appointments retrieved successfully."
      )
    );
  }
);

export const updateAppointmentStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(APPOINTMENT_STATUS).includes(status)) {
      throw new ApiError(400, "Invalid appointment status.");
    }

    const currentAppointment = await Appointment.findById(id);
    if (!currentAppointment) {
      throw new ApiError(404, "Appointment not found.");
    }

    // Rule: Only pending appointments can be confirmed
    if (
      status === APPOINTMENT_STATUS.CONFIRMED &&
      currentAppointment.status !== APPOINTMENT_STATUS.PENDING
    ) {
      throw new ApiError(
        400,
        "Only pending appointments can be confirmed. This appointment has already been processed."
      );
    }

    // Rule: Admin can cancel pending or confirmed appointments
    if (
      status === APPOINTMENT_STATUS.CANCELLED &&
      currentAppointment.status === APPOINTMENT_STATUS.CANCELLED
    ) {
      throw new ApiError(400, "This appointment is already cancelled.");
    }

    const updatePayload: Record<string, unknown> = { status };
    if (status === APPOINTMENT_STATUS.CANCELLED) {
      updatePayload.cancelledAt = new Date();
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    )
      .populate("customerId", "name email phone image")
      .populate("serviceId", "title category price durationMinutes images");

    res.status(200).json(
      new ApiResponse(
        200,
        appointment,
        `Appointment status updated to ${status}.`
      )
    );
  }
);

export const deleteAppointment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required.");
    }

    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      throw new ApiError(404, "Appointment not found.");
    }

    // Protection rule: Paid appointments cannot be deleted to preserve financial audit trail
    if (appointment.paymentStatus === PAYMENT_STATUS.PAID) {
      throw new ApiError(
        400,
        "Paid appointments cannot be deleted to preserve financial audit and transaction records."
      );
    }

    // Customer can only delete their own appointments; Admin can delete any
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      !appointment.customerId.equals(req.user._id)
    ) {
      throw new ApiError(
        403,
        "Access denied. You can only delete your own appointments."
      );
    }

    await Appointment.findByIdAndDelete(id);

    res.status(200).json(
      new ApiResponse(200, null, "Appointment deleted successfully.")
    );
  }
);
