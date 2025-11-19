import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password === ADMIN_PASSWORD) {
      // Cria resposta com cookie de autenticação
      const response = NextResponse.json({ success: true });
      
      // Define cookie HttpOnly seguro
      response.cookies.set("superAccess", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 horas
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "Senha incorreta" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return NextResponse.json(
      { success: false, message: "Erro no servidor" },
      { status: 500 }
    );
  }
}
