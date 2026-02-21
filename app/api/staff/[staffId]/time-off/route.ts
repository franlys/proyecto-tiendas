import { NextRequest, NextResponse } from "next/server";
import {
  addTimeOffAdmin,
  removeTimeOffAdmin,
  approveTimeOffAdmin,
  getStaffByIdAdmin,
} from "@/lib/services/staff-admin.service";
import type { TimeOffType } from "@/lib/types/staff.types";

/**
 * GET /api/staff/[staffId]/time-off?shopId=xxx
 * Obtener las ausencias de un empleado
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { staffId } = await params;
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");

  if (!shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  try {
    const staff = await getStaffByIdAdmin(shopId, staffId);
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ timeOff: staff.timeOff || [] });
  } catch (error) {
    console.error("Error fetching time-off:", error);
    return NextResponse.json(
      { error: "Failed to fetch time-off" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff/[staffId]/time-off
 * Agregar una nueva ausencia
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { staffId } = await params;

  try {
    const body = await request.json();
    const { shopId, type, startDate, endDate, reason, approved = false } = body;

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "type, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes: TimeOffType[] = ["vacation", "sick", "personal", "holiday", "training"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Valid types: vacation, sick, personal, holiday, training" },
        { status: 400 }
      );
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: "startDate must be before or equal to endDate" },
        { status: 400 }
      );
    }

    const timeOff = await addTimeOffAdmin(shopId, staffId, {
      type,
      startDate,
      endDate,
      reason: reason || "",
      approved,
    });

    if (!timeOff) {
      return NextResponse.json(
        { error: "Failed to add time-off" },
        { status: 500 }
      );
    }

    return NextResponse.json({ timeOff }, { status: 201 });
  } catch (error) {
    console.error("Error adding time-off:", error);
    return NextResponse.json(
      { error: "Failed to add time-off" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staff/[staffId]/time-off?shopId=xxx&timeOffId=xxx
 * Eliminar una ausencia
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { staffId } = await params;
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const timeOffId = searchParams.get("timeOffId");

  if (!shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  if (!timeOffId) {
    return NextResponse.json({ error: "timeOffId is required" }, { status: 400 });
  }

  try {
    const success = await removeTimeOffAdmin(shopId, staffId, timeOffId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to remove time-off" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing time-off:", error);
    return NextResponse.json(
      { error: "Failed to remove time-off" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/staff/[staffId]/time-off
 * Aprobar/rechazar una ausencia
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { staffId } = await params;

  try {
    const body = await request.json();
    const { shopId, timeOffId, approved, approvedBy } = body;

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    if (!timeOffId) {
      return NextResponse.json({ error: "timeOffId is required" }, { status: 400 });
    }

    if (typeof approved !== "boolean") {
      return NextResponse.json({ error: "approved must be a boolean" }, { status: 400 });
    }

    const success = await approveTimeOffAdmin(
      shopId,
      staffId,
      timeOffId,
      approved,
      approvedBy || "admin"
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update time-off approval" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating time-off approval:", error);
    return NextResponse.json(
      { error: "Failed to update time-off approval" },
      { status: 500 }
    );
  }
}
