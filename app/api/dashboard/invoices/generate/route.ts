import { NextRequest, NextResponse } from "next/server";
import { validateInvoicePayload } from "@/lib/invoice-payload";
import { getInvoiceConfig, InvoiceConfigError } from "@/lib/invoice-config";
import { getNextInvoiceNumber } from "@/lib/invoice-number";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const validation = validateInvoicePayload(body);
    if (!validation.ok) {
      return NextResponse.json(
        { error: "Validation échouée", fields: validation.errors },
        { status: 400 },
      );
    }

    let issuer;
    try {
      issuer = getInvoiceConfig();
    } catch (e) {
      if (e instanceof InvoiceConfigError) {
        return NextResponse.json(
          { error: e.message, missing: e.missing },
          { status: 500 },
        );
      }
      throw e;
    }

    const invoiceNumber = await getNextInvoiceNumber();
    const pdf = await renderInvoicePdf({
      payload: validation.payload,
      issuer,
      invoiceNumber,
    });

    const bytes = new Uint8Array(pdf);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture-${invoiceNumber}.pdf"`,
        "X-Invoice-Number": invoiceNumber,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
