import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../services/stripe.service";
import { ENV } from "../config/env";
import { Appointment } from "../models/Appointment";
import { Transaction } from "../models/Transaction";
import { APPOINTMENT_STATUS, TRANSACTION_STATUS } from "../constants";
import { AuthenticatedRequest } from "../middlewares/auth";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const handleStripeWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;

  if (!sig || !ENV.STRIPE_WEBHOOK_SECRET) {
    console.warn("[Stripe Webhook] Missing signature or webhook secret.");
    res.status(400).send("Webhook signature missing or secret not configured.");
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const appointmentId = session.metadata?.appointmentId;

    if (appointmentId) {
      try {
        const appointment = await Appointment.findById(appointmentId);
        if (appointment) {
          // Idempotency: Prevent duplicate transaction recording
          let transaction = await Transaction.findOne({
            stripeSessionId: session.id,
          });

          if (!transaction) {
            transaction = await Transaction.create({
              customerId: appointment.customerId,
              appointmentId: appointment._id,
              stripeSessionId: session.id,
              stripePaymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : "",
              amount: (session.amount_total || 0) / 100,
              currency: session.currency || "usd",
              status: TRANSACTION_STATUS.SUCCEEDED,
            });
          }

          appointment.status = APPOINTMENT_STATUS.CONFIRMED;
          appointment.transactionId = transaction._id;
          await appointment.save();

          console.log(
            `[Stripe Webhook] Successfully processed payment for appointment: ${appointment._id}`
          );
        }
      } catch (dbError) {
        console.error("[Stripe Webhook] DB error on webhook processing:", dbError);
      }
    }
  }

  res.status(200).json({ received: true });
};

export const getMyTransactions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json(new ApiResponse(401, null, "Authentication required."));
      return;
    }

    const transactions = await Transaction.find({ customerId: req.user._id })
      .populate({
        path: "appointmentId",
        populate: { path: "serviceId", select: "title price durationMinutes" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(
      new ApiResponse(
        200,
        transactions,
        "Customer transactions retrieved successfully."
      )
    );
  }
);

export const getAllTransactions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page = "1", limit = "20" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find()
        .populate("customerId", "name email phone image")
        .populate({
          path: "appointmentId",
          populate: { path: "serviceId", select: "title price" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          transactions,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        },
        "All transactions retrieved successfully."
      )
    );
  }
);
