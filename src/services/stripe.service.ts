import Stripe from "stripe";
import { ENV } from "../config/env";

export const stripe = new Stripe(
  ENV.STRIPE_SECRET_KEY || "sk_test_placeholder_key",
  {
    apiVersion: "2025-01-27.acacia" as unknown as Stripe.LatestApiVersion,
    typescript: true,
  }
);

export const createStripeCheckoutSession = async ({
  appointmentId,
  serviceTitle,
  amount,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  appointmentId: string;
  serviceTitle: string;
  amount: number;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> => {
  if (!ENV.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
  }

  // Convert amount to cents
  const unitAmountInCents = Math.round(amount * 100);

  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: ENV.STRIPE_CURRENCY,
          product_data: {
            name: serviceTitle,
            description: `SalonBook reservation for ${serviceTitle}`,
          },
          unit_amount: unitAmountInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      appointmentId,
    },
  });
};
