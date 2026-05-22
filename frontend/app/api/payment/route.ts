import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import crypto from "crypto";

export const dynamic = 'force-dynamic';
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// Razorpay payment configuration
const RAZORPAY_PLANS = {
  pro_monthly: {
    name: "Pro Monthly",
    price: 249900, // ₹2,499 in paise
    credits: 100,
    duration: "monthly",
  },
  pro_yearly: {
    name: "Pro Yearly",
    price: 2499900, // ₹24,999 in paise
    credits: 1200, // 100 * 12
    duration: "yearly",
  },
  // Legacy/Extra Credit Packs (Optional)
  credits_10: {
    name: "10 Credits",
    price: 29900, // ₹299
    credits: 10,
    duration: "one-time",
  },
  credits_50: {
    name: "50 Credits",
    price: 99900, // ₹999
    credits: 50,
    duration: "one-time",
  },
  credits_100: {
    name: "100 Credits",
    price: 179900, // ₹1,799
    credits: 100,
    duration: "one-time",
  },
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { planId, paymentId, orderId, signature } = await request.json();

    if (!process.env.RAZORPAY_KEY_SECRET) {
         return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // Verify Razorpay signature
    const text = orderId + "|" + paymentId;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generated_signature !== signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }
    
    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const plan = RAZORPAY_PLANS[planId as keyof typeof RAZORPAY_PLANS];
    
    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Add credits to user
    await user.addCredits(plan.credits);

    // Update subscription if it's a subscription plan
    if (plan.duration !== "one-time") {
      user.plan = "pro"; // Currently only 'pro' logic
      user.subscriptionStatus = "active";
      user.lastPaymentDate = new Date();
      
      // Calculate next billing date
      const nextBilling = new Date();
      if (plan.duration === "monthly") {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      } else {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      }
      user.nextBillingDate = nextBilling;
      
      // Store payment info
      // user.payments.push({ id: paymentId, amount: plan.price / 100, date: new Date() }); // If payment history array existed
      user.lastPaymentDate = new Date();
      user.customerId = user.customerId || ""; // Could store Razorpay customer ID here if needed
      
      await user.save();
    }

    console.log(`✅ Payment processed for ${user.email}. Plan: ${plan.name}. Credits added: ${plan.credits}`);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${plan.credits} credits!`,
      creditsBalance: user.credits,
      plan: user.plan,
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}

// Create Razorpay order
export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    const plan = RAZORPAY_PLANS[planId as keyof typeof RAZORPAY_PLANS];
    
    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const options = {
      amount: plan.price,
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
      notes: {
        planId: planId,
        userEmail: session.user.email
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        planName: plan.name,
        credits: plan.credits,
      },
      razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
