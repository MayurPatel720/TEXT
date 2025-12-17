import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Razorpay payment configuration
const RAZORPAY_PLANS = {
  pro_monthly: {
    name: "Pro Monthly",
    price: 1999, // ₹19.99 = 1999 paise
    credits: 100,
    duration: "monthly",
  },
  pro_yearly: {
    name: "Pro Yearly",
    price: 19190, // ₹191.90 = 19190 paise (20% discount)
    credits: 1200,
    duration: "yearly",
  },
  credits_10: {
    name: "10 Credits",
    price: 299, // ₹2.99
    credits: 10,
    duration: "one-time",
  },
  credits_50: {
    name: "50 Credits",
    price: 999, // ₹9.99
    credits: 50,
    duration: "one-time",
  },
  credits_100: {
    name: "100 Credits",
    price: 1799, // ₹17.99
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

    // Verify Razorpay signature (in production, verify the signature)
    // For now, we'll skip verification for demo purposes
    
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
      user.plan = plan.duration === "monthly" ? "pro" : "pro";
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

    // In production, create a Razorpay order here
    // For demo, return mock order
    const mockOrder = {
      id: `order_${Date.now()}`,
      amount: plan.price,
      currency: "INR",
      planName: plan.name,
      credits: plan.credits,
    };

    return NextResponse.json({
      success: true,
      order: mockOrder,
      razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "demo_key",
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
