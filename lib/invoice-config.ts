export interface InvoiceIssuerConfig {
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  email: string;
  phone: string;
  iban: string;
  bic: string;
  bankName: string;
  website: string;
}

export class InvoiceConfigError extends Error {
  constructor(public missing: string[]) {
    super(
      `Configuration facture incomplète. Variables manquantes : ${missing.join(", ")}`,
    );
    this.name = "InvoiceConfigError";
  }
}

const REQUIRED_KEYS: { env: string; field: keyof InvoiceIssuerConfig }[] = [
  { env: "INVOICE_LEGAL_NAME", field: "legalName" },
  { env: "INVOICE_ADDRESS_LINE1", field: "addressLine1" },
  { env: "INVOICE_ADDRESS_LINE2", field: "addressLine2" },
  { env: "INVOICE_EMAIL", field: "email" },
  { env: "INVOICE_IBAN", field: "iban" },
  { env: "INVOICE_BIC", field: "bic" },
  { env: "INVOICE_BANK_NAME", field: "bankName" },
];

export function getInvoiceConfig(): InvoiceIssuerConfig {
  const missing: string[] = [];
  const values: Partial<InvoiceIssuerConfig> = {};

  for (const { env, field } of REQUIRED_KEYS) {
    const v = process.env[env]?.trim();
    if (!v) missing.push(env);
    else values[field] = v;
  }

  if (missing.length > 0) throw new InvoiceConfigError(missing);

  return {
    ...(values as Required<typeof values>),
    phone: process.env.INVOICE_PHONE?.trim() ?? "",
    website: process.env.INVOICE_WEBSITE?.trim() ?? "",
  } as InvoiceIssuerConfig;
}
