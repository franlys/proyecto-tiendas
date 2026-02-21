import { NextRequest, NextResponse } from "next/server";
import {
  getStaffByIdAdmin,
  updateStaffAdmin,
  deleteStaffAdmin,
  toggleStaffActiveAdmin,
} from "@/lib/services/staff-admin.service";
import type { UpdateStaffInput } from "@/lib/types/staff.types";

/**
 * GET /api/staff/[staffId]?shopId=xxx
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params;
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    const staff = await getStaffByIdAdmin(shopId, staffId);

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/staff/[staffId]
 * Actualizar empleado
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params;
    const body = await request.json();
    const { shopId, action, ...updates } = body;

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    // Acción especial: toggle active
    if (action === "toggle-active") {
      const success = await toggleStaffActiveAdmin(
        shopId,
        staffId,
        updates.isActive
      );
      if (!success) {
        return NextResponse.json(
          { error: "Failed to toggle staff status" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    // Actualización normal
    const staff = await updateStaffAdmin(shopId, staffId, updates as UpdateStaffInput);

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { error: "Failed to update staff" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staff/[staffId]?shopId=xxx
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params;
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    const success = await deleteStaffAdmin(shopId, staffId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete staff" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { error: "Failed to delete staff" },
      { status: 500 }
    );
  }
}
