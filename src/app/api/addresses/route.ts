import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AddressSchema } from "@/lib/schemas";

// In-memory fallback if needed, but we use SQLite database.
export async function GET() {
  try {
    const addresses = await prisma.address.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(addresses);
  } catch (error) {
    console.error("GET /api/addresses error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar endereços" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = AddressSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { cep } = result.data;
    const existing = await prisma.address.findUnique({
      where: { cep },
    });

    if (existing) {
      return NextResponse.json(
        { error: "CEP já cadastrado" },
        { status: 400 }
      );
    }

    const address = await prisma.address.create({
      data: result.data,
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error("POST /api/addresses error:", error);
    return NextResponse.json(
      { error: "Erro ao criar endereço" },
      { status: 500 }
    );
  }
}
