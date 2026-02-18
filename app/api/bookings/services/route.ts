import { NextRequest, NextResponse } from "next/server";
import {
  getServicesAdmin,
  getActiveServicesAdmin,
  createServiceAdmin,
} from "@/lib/services/booking-admin.service";
import type { CreateServiceInput } from "@/lib/types/booking.types";

/**
 * GET /api/bookings/services?shopId=xxx
 * Get all services for a shop
 * Add ?active=true to get only active services
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const activeOnly = searchParams.get("active") === "true";

  if (!shopId) {
    return NextResponse.json(
      { error: "shopId is required" },
      { status: 400 }
    );
  }

  try {
    const services = activeOnly
      ? await getActiveServicesAdmin(shopId)
      : await getServicesAdmin(shopId);

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings/services
 * Create a new service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, ...serviceData } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: "shopId is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["name", "duration", "price"];
    for (const field of requiredFields) {
      if (serviceData[field] === undefined || serviceData[field] === null) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const service = await createServiceAdmin(shopId, serviceData as CreateServiceInput);

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
