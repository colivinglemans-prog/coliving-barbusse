import { NextRequest, NextResponse } from "next/server";
import {
  loadFiscalConfig,
  sumCharges,
  type FiscalConfig,
  type BienFiscal,
} from "@/lib/fiscal/config";
import { computeRevenusBien, type RevenusBien } from "@/lib/fiscal/revenus";
import {
  computeBICBien,
  sumResultatsBIC,
  type ResultatBICBien,
  type ResultatBICTotaux,
} from "@/lib/fiscal/bic";
import { computeIRImpact, type IRImpactResult } from "@/lib/fiscal/ir";
import { testLMP, type LMPTestResult } from "@/lib/fiscal/lmp-test";
import { computeCotisations, type CotisationsResult } from "@/lib/fiscal/cotisations";
import { buildOrientations, type OrientationsResult } from "@/lib/fiscal/orientations";

export interface FiscalBienDetail {
  bienId: string;
  bienNom: string;
  source: "beds24" | "manuel";
  vendu?: boolean;
  classeMeubleTourisme: boolean;
  revenus: RevenusBien;
  bic: ResultatBICBien;
  charges: {
    interetsEmprunt: number;
    taxeFonciere: number;
    assurance: number;
    cfe: number;
    fraisComptable: number;
    entretien: number;
    chargesCopro: number;
    autres: number;
    total: number;
  };
}

export interface FiscalResponse {
  year: number;
  foyer: FiscalConfig["foyer"];
  constantes: FiscalConfig["year"]["constantes"];
  biens: FiscalBienDetail[];
  totaux: ResultatBICTotaux & {
    recettesMeubleTourisme: number;
  };
  lmpTest: LMPTestResult;
  ir: IRImpactResult;
  cotisations: CotisationsResult;
  impotTotal: number;
  orientations: OrientationsResult["orientations"];
  echeances: OrientationsResult["echeances"];
}

function buildChargesDetail(bien: BienFiscal) {
  const c = bien.chargesDeductibles;
  return {
    interetsEmprunt: c.interetsEmprunt ?? 0,
    taxeFonciere: c.taxeFonciere ?? 0,
    assurance: c.assurance ?? 0,
    cfe: c.cfe ?? 0,
    fraisComptable: c.fraisComptable ?? 0,
    entretien: c.entretien ?? 0,
    chargesCopro: c.chargesCopro ?? 0,
    autres: c.autres ?? 0,
    total: sumCharges(c),
  };
}

export async function GET(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();
  const useProjected = req.nextUrl.searchParams.get("projected") !== "false";

  let config: FiscalConfig;
  try {
    config = loadFiscalConfig(year);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fiscal config error" },
      { status: 500 },
    );
  }

  if (config.year.biens.length === 0) {
    return NextResponse.json(
      { error: `Aucune configuration fiscale pour l'année ${year}. Créez data/fiscal/${year}.json.` },
      { status: 404 },
    );
  }

  let biensDetails: FiscalBienDetail[];
  try {
    biensDetails = await Promise.all(
      config.year.biens.map(async (bien): Promise<FiscalBienDetail> => {
        const revenus = await computeRevenusBien(bien, year);
        const bic = computeBICBien(bien, revenus, useProjected);
        return {
          bienId: bien.id,
          bienNom: bien.nom,
          source: bien.source,
          vendu: bien.vendu,
          classeMeubleTourisme: bien.classeMeubleTourisme,
          revenus,
          bic,
          charges: buildChargesDetail(bien),
        };
      }),
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Beds24 error" },
      { status: 502 },
    );
  }

  const resultatsBIC = biensDetails.map((b) => b.bic);
  const totauxBIC = sumResultatsBIC(resultatsBIC);
  const recettesMeubleTourisme = totauxBIC.ca;

  const lmpTest = testLMP(
    recettesMeubleTourisme,
    config.foyer.autresRevenusActiviteFoyer,
    config.year.constantes.seuilSSIMeubleTourisme,
  );

  const ir = computeIRImpact(
    config.foyer.revenuImposableFoyer,
    totauxBIC.resultat,
    config.foyer.nbParts,
  );

  const cotisations = computeCotisations(
    totauxBIC.resultat,
    lmpTest.isLMP,
    config.year.constantes,
  );

  const impotTotal = ir.irSupplementaire + cotisations.total;

  const hasAnyClasse = biensDetails.some((b) => b.classeMeubleTourisme);

  const { orientations, echeances } = buildOrientations({
    recettes: recettesMeubleTourisme,
    seuilSSI: config.year.constantes.seuilSSIMeubleTourisme,
    lmpTest,
    hasMeubleTourismeClasse: hasAnyClasse,
    year,
  });

  const response: FiscalResponse = {
    year,
    foyer: config.foyer,
    constantes: config.year.constantes,
    biens: biensDetails,
    totaux: { ...totauxBIC, recettesMeubleTourisme },
    lmpTest,
    ir,
    cotisations,
    impotTotal,
    orientations,
    echeances,
  };

  return NextResponse.json(response);
}
