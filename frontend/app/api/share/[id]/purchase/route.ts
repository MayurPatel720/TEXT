import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Generation from "@/models/Generation";

export const dynamic = 'force-dynamic';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// GET: Create a Razorpay order for this specific image
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // For our UI mocking tests
        if (id.startsWith("mock-")) {
            const options = {
                amount: 10000, // ₹100 in paise
                currency: "INR",
                receipt: `mock_receipt_${Date.now()}`,
                notes: {
                    generationId: id,
                    type: "image_purchase"
                }
            };
            const order = await razorpay.orders.create(options);

            return NextResponse.json({
                success: true,
                order: {
                    id: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    planName: "Design Commercial License",
                },
                razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            });
        }

        await connectDB();
        const generation = await Generation.findById(id);

        if (!generation || generation.status !== 'completed') {
            return NextResponse.json(
                { error: "Image not found" },
                { status: 404 }
            );
        }

        const options = {
            amount: 10000, // ₹100 in paise
            currency: "INR",
            receipt: `order_rcptid_${Date.now()}`,
            notes: {
                generationId: id,
                type: "image_purchase"
            }
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                planName: "Design Commercial License",
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

// POST: Verify payment and return the unwatermarked image URL
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const { paymentId, orderId, signature } = await request.json();

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

        // For our UI mocking tests
        if (id.startsWith("mock-")) {
            const MOCK_IMAGE_URL = "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2787&auto=format&fit=crop";
            return NextResponse.json({
                success: true,
                message: "Purchase successful",
                url: MOCK_IMAGE_URL
            });
        }

        await connectDB();
        const generation = await Generation.findById(id);

        if (!generation || generation.status !== 'completed') {
            return NextResponse.json(
                { error: "Image not found" },
                { status: 404 }
            );
        }

        // Success! Return the highly-coveted unwatermarked image URL
        return NextResponse.json({
            success: true,
            message: "Purchase successful",
            url: generation.generatedImageUrl || generation.referenceImageUrl // fallback just in case
        });
    } catch (error) {
        console.error("Payment processing error:", error);
        return NextResponse.json(
            { error: "Failed to process payment" },
            { status: 500 }
        );
    }
}
