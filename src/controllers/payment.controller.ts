import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe, createStripeCheckoutSession } from "../services/stripe.service";
import { ENV } from "../config/env";
import { Appointment } from "../models/Appointment";
import { Transaction } from "../models/Transaction";
import { IService } from "../models/Service";
import { APPOINTMENT_STATUS, PAYMENT_STATUS, TRANSACTION_STATUS, USER_ROLES } from "../constants";
import { AuthenticatedRequest } from "../middlewares/auth";
import { ApiError } from "../utils/ApiError";
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

          appointment.paymentStatus = PAYMENT_STATUS.PAID;
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

export const createAppointmentCheckoutSession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required.");
    }

    const { appointmentId } = req.body;
    if (!appointmentId) {
      throw new ApiError(400, "Appointment ID is required.");
    }

    const appointment = await Appointment.findById(appointmentId).populate<{
      serviceId: IService;
    }>("serviceId");

    if (!appointment) {
      throw new ApiError(404, "Appointment not found.");
    }

    if (
      !appointment.customerId.equals(req.user._id) &&
      req.user.role !== USER_ROLES.ADMIN
    ) {
      throw new ApiError(
        403,
        "Access denied. You can only initiate payment for your own appointments."
      );
    }

    if (appointment.status !== APPOINTMENT_STATUS.CONFIRMED) {
      throw new ApiError(
        400,
        "Only confirmed appointments can be paid. Please wait for salon confirmation."
      );
    }

    if (appointment.paymentStatus === PAYMENT_STATUS.PAID) {
      throw new ApiError(400, "This appointment has already been paid.");
    }

    const serviceTitle = appointment.serviceId?.title || "Salon Service";
    const amount =
      appointment.servicePrice || appointment.serviceId?.price || 50;

    let checkoutUrl = "";
    if (
      ENV.STRIPE_SECRET_KEY &&
      !ENV.STRIPE_SECRET_KEY.includes("your_stripe")
    ) {
      const session = await createStripeCheckoutSession({
        appointmentId: appointment._id.toString(),
        serviceTitle,
        amount,
        customerEmail: req.user.email,
        successUrl: `${ENV.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&appointment_id=${appointment._id}`,
        cancelUrl: `${ENV.CLIENT_URL}/payment/cancel?appointment_id=${appointment._id}`,
      });

      appointment.stripeSessionId = session.id;
      await appointment.save();
      checkoutUrl = session.url || "";
    } else {
      // Development mock fallback if Stripe secret key has not yet been populated
      const mockSessionId = `cs_mock_${Date.now()}`;
      appointment.stripeSessionId = mockSessionId;
      await appointment.save();
      checkoutUrl = `${ENV.CLIENT_URL}/payment/success?session_id=${mockSessionId}&appointment_id=${appointment._id}`;
    }

    res.status(200).json(
      new ApiResponse(
        200,
        { checkoutUrl, url: checkoutUrl },
        "Stripe checkout session initialized successfully."
      )
    );
  }
);

export const verifyCheckoutSession = asyncHandler(
  async (req: Request, res: Response) => {
    const { sessionId, appointmentId } = req.body;

    if (!sessionId && !appointmentId) {
      throw new ApiError(400, "Session ID or Appointment ID is required.");
    }

    let appointment = null;
    if (appointmentId) {
      appointment = await Appointment.findById(appointmentId);
    }
    if (!appointment && sessionId) {
      appointment = await Appointment.findOne({ stripeSessionId: sessionId });
    }

    if (!appointment) {
      throw new ApiError(404, "Appointment not found for payment verification.");
    }

    let isPaid = false;
    let paymentIntentId = "";
    let amountTotal = appointment.servicePrice;
    let currency = "usd";

    if (
      sessionId &&
      !sessionId.startsWith("cs_mock_") &&
      ENV.STRIPE_SECRET_KEY &&
      !ENV.STRIPE_SECRET_KEY.includes("placeholder")
    ) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (
          session.payment_status === "paid" ||
          session.status === "complete"
        ) {
          isPaid = true;
          paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : "";
          amountTotal =
            (session.amount_total || 0) / 100 || appointment.servicePrice;
          currency = session.currency || "usd";
        }
      } catch (stripeErr) {
        console.warn("[Stripe Verify] Error retrieving session from Stripe:", stripeErr);
      }
    } else if (sessionId && sessionId.startsWith("cs_mock_")) {
      isPaid = true;
    }

    if (isPaid) {
      let transaction = await Transaction.findOne({
        stripeSessionId: sessionId || appointment.stripeSessionId || `txn_${appointment._id}`,
      });

      if (!transaction) {
        transaction = await Transaction.create({
          customerId: appointment.customerId,
          appointmentId: appointment._id,
          stripeSessionId:
            sessionId || appointment.stripeSessionId || `txn_${Date.now()}`,
          stripePaymentIntentId: paymentIntentId,
          amount: amountTotal,
          currency,
          status: TRANSACTION_STATUS.SUCCEEDED,
        });
      }

      appointment.paymentStatus = PAYMENT_STATUS.PAID;
      appointment.status = APPOINTMENT_STATUS.CONFIRMED;
      appointment.transactionId = transaction._id;
      await appointment.save();

      res.status(200).json(
        new ApiResponse(
          200,
          { appointment, transaction, verified: true },
          "Payment verified and confirmed successfully."
        )
      );
      return;
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          appointment,
          verified: appointment.paymentStatus === PAYMENT_STATUS.PAID,
        },
        appointment.paymentStatus === PAYMENT_STATUS.PAID
          ? "Appointment is already paid."
          : "Payment pending verification."
      )
    );
  }
);

export const simulateDevPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { appointmentId, sessionId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found.");
    }

    let transaction = await Transaction.findOne({
      stripeSessionId: sessionId || appointment.stripeSessionId || `dev_${appointment._id}`,
    });

    if (!transaction) {
      transaction = await Transaction.create({
        customerId: appointment.customerId,
        appointmentId: appointment._id,
        stripeSessionId: sessionId || appointment.stripeSessionId || `dev_${Date.now()}`,
        amount: appointment.servicePrice,
        currency: "usd",
        status: TRANSACTION_STATUS.SUCCEEDED,
      });
    }

    appointment.paymentStatus = PAYMENT_STATUS.PAID;
    appointment.status = APPOINTMENT_STATUS.CONFIRMED;
    appointment.transactionId = transaction._id;
    await appointment.save();

    res.status(200).json(
      new ApiResponse(
        200,
        { appointment, transaction },
        "Payment verified and recorded."
      )
    );
  }
);

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
