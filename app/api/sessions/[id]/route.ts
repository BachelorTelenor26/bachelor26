import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const session = await prisma.troubleshootingSession.findUnique({
      where: { id },
      include: {
        article: {
          include: {
            category: true,
            deviceType: true,
          }
        },
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        answers: {
          include: {
            step: true,
            choice: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sesjon ikke funnet' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Feil i GET /api/sessions/[id]:", error);
    return NextResponse.json(
      { error: 'Kunne ikke hente sesjon' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { outcome, escalationReason, customerContact, customerEmail, customerServiceNotes } = body;

    const validOutcomes = ["IN_PROGRESS", "RESOLVED", "ESCALATED", "ABANDONED"];
    if (outcome !== undefined && !validOutcomes.includes(outcome)) {
      return NextResponse.json(
        { error: "Ugyldig sesjonsstatus" },
        { status: 400 }
      );
    }

    const rawContact =
      typeof customerContact === "string"
        ? customerContact.trim()
        : typeof customerEmail === "string"
          ? customerEmail.trim()
          : undefined;
    const isPhoneNumber =
      rawContact !== undefined && /^\d+$/.test(rawContact);
    const normalizedEmail =
      rawContact !== undefined && !isPhoneNumber && rawContact.includes("@")
        ? rawContact.toLowerCase()
        : undefined;
    const normalizedPhone =
      isPhoneNumber ? rawContact : undefined;

    if (rawContact !== undefined && rawContact.length > 0 && !rawContact.includes("@") && !isPhoneNumber) {
      return NextResponse.json(
        { error: "Ugyldig kontaktinfo. Bruk e-post eller et 8-sifret mobilnummer." },
        { status: 400 }
      );
    }

    if (normalizedPhone !== undefined && normalizedPhone.length > 0 && normalizedPhone.length !== 8) {
      return NextResponse.json(
        { error: "Mobilnummer må være 8 siffer" },
        { status: 400 }
      );
    }

    const isEscalated = outcome === "ESCALATED";
    const normalizedEscalationReason =
      typeof escalationReason === "string" ? escalationReason.trim() : undefined;
    const normalizedCustomerServiceNotes =
      typeof customerServiceNotes === "string" ? customerServiceNotes.trim() : undefined;

    if (isEscalated && normalizedEscalationReason !== undefined && normalizedEscalationReason.length === 0) {
      return NextResponse.json(
        { error: "Begrunnelse er påkrevd ved eskalering" },
        { status: 400 }
      );
    }

    const existingSession = await prisma.troubleshootingSession.findUnique({
      where: { id },
      select: { outcome: true, escalationReason: true },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: "Sesjon ikke funnet" },
        { status: 404 }
      );
    }

    const nextOutcome = outcome ?? existingSession.outcome;
    const effectiveEscalationReason =
      normalizedEscalationReason ?? existingSession.escalationReason?.trim() ?? "";

    if (nextOutcome === "ESCALATED" && effectiveEscalationReason.length === 0) {
      return NextResponse.json(
        { error: "Begrunnelse er påkrevd ved eskalering" },
        { status: 400 }
      );
    }

    let resolvedCustomerId: string | null | undefined;
    if (normalizedEmail !== undefined || normalizedPhone !== undefined) {
      if ((normalizedEmail !== undefined && normalizedEmail.length === 0) ||
          (normalizedPhone !== undefined && normalizedPhone.length === 0)) {
        resolvedCustomerId = null;
      } else if (normalizedEmail !== undefined) {
        const existingCustomer = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });
        if (existingCustomer) {
          resolvedCustomerId = existingCustomer.id;
        } else {
          const newCustomer = await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: normalizedEmail.split("@")[0],
              firstName: normalizedEmail.split("@")[0],
              lastName: "",
            },
            select: { id: true },
          });
          resolvedCustomerId = newCustomer.id;
        }
      } else if (normalizedPhone !== undefined) {
        const existingCustomer = await prisma.user.findUnique({
          where: { phoneNumber: normalizedPhone },
          select: { id: true },
        });
        if (existingCustomer) {
          resolvedCustomerId = existingCustomer.id;
        } else {
          const newCustomer = await prisma.user.create({
            data: {
              phoneNumber: normalizedPhone,
              name: `Kunde ${normalizedPhone}`,
              firstName: `Kunde`,
              lastName: normalizedPhone,
            },
            select: { id: true },
          });
          resolvedCustomerId = newCustomer.id;
        }
      }
    }

    const updatedSession = await prisma.troubleshootingSession.update({
      where: { id },
      data: {
        ...(outcome && { outcome }),
        ...(outcome !== undefined && { completed: outcome !== "IN_PROGRESS" }),
        ...(resolvedCustomerId !== undefined && { customerId: resolvedCustomerId }),
        ...(normalizedCustomerServiceNotes !== undefined && {
          customerServiceNotes:
            normalizedCustomerServiceNotes.length > 0
              ? normalizedCustomerServiceNotes
              : null,
        }),
        ...(nextOutcome === "ESCALATED"
          ? { escalationReason: effectiveEscalationReason }
          : { escalationReason: null }),
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Feil i PATCH /api/sessions/[id]:", error);
    return NextResponse.json(
      { error: 'Kunne ikke oppdatere sesjon' },
      { status: 500 }
    );
  }
}
