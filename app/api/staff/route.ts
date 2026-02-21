import { NextRequest, NextResponse } from "next/server";
import {
  getStaffAdmin,
  getActiveStaffAdmin,
  createStaffAdmin,
  getStaffByServicesAdmin,
} from "@/lib/services/staff-admin.service";
import type { CreateStaffInput } from "@/lib/types/staff.types";

/**
 * GET /api/staff?shopId=xxx
 * GET /api/staff?shopId=xxx&active=true
 * GET /api/staff?shopId=xxx&services=svc1,svc2
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const activeOnly = searchParams.get("active") === "true";
  const servicesParam = searchParams.get("services");

  if (!shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  try {
    let staff;

    if (servicesParam) {
      // Filtrar por servicios que pueden realizar
      const serviceIds = servicesParam.split(",").filter(Boolean);
      staff = await getStaffByServicesAdmin(shopId, serviceIds);
    } else if (activeOnly) {
      staff = await getActiveStaffAdmin(shopId);
    } else {
      staff = await getStaffAdmin(shopId);
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
 * POST /api/staff
 * Crear nuevo empleado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, ...staffData } = body;

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    // Validar campos requeridos
    if (!staffData.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (!staffData.role) {
      return NextResponse.json({ error: "role is required" }, { status: 400 });
    }

    const staff = await createStaffAdmin(shopId, staffData as CreateStaffInput);

    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { error: "Failed to create staff" },
      { status: 500 }
    );
  }
}
