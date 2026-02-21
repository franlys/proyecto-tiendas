import { NextRequest, NextResponse } from "next/server";
import {
  getServiceByIdAdmin,
  updateServiceAdmin,
  deleteServiceAdmin,
} from "@/lib/services/booking-admin.service";

interface RouteParams {
  params: Promise<{ serviceId: string }>;
}

/**
 * GET /api/bookings/services/[serviceId]?shopId=xxx
 * Get a single service
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { serviceId } = await params;
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");

  if (!shopId) {
    return NextResponse.json(
      { error: "shopId is required" },
      { status: 400 }
    );
  }

  try {
    const service = await getServiceByIdAdmin(shopId, serviceId);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

/**
 * PUT/PATCH /api/bookings/services/[serviceId]
 * Update a service
 */
async function handleUpdate(
  request: NextRequest,
  { params }: RouteParams
) {
  const { serviceId } = await params;

  try {
    const body = await request.json();
    const { shopId, ...updates } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: "shopId is required" },
        { status: 400 }
      );
    }

    const service = await updateServiceAdmin(shopId, serviceId, updates);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// Export both PUT and PATCH
export const PUT = handleUpdate;
export const PATCH = handleUpdate;

/**
 * DELETE /api/bookings/services/[serviceId]?shopId=xxx
 * Delete a service
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { serviceId } = await params;
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");

  if (!shopId) {
    return NextResponse.json(
      { error: "shopId is required" },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteServiceAdmin(shopId, serviceId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete service" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
