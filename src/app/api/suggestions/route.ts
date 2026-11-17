import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorize";
import { getSuggestions, SUGGESTION_FIELDS, type SuggestionField } from "@/lib/queries/suggestions";

/** GET /api/suggestions?field=brand|source|supplier|platform → string[] */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const field = request.nextUrl.searchParams.get("field");
  if (!field || !SUGGESTION_FIELDS.includes(field as SuggestionField)) {
    return NextResponse.json(
      { error: `field must be one of ${SUGGESTION_FIELDS.join(", ")}` },
      { status: 400 }
    );
  }
  return NextResponse.json(await getSuggestions(field as SuggestionField));
}
