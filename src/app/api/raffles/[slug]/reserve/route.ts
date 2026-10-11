import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({error:"Checkout desativado. Este site é apenas uma demonstração visual."},{status:403,headers:{"Cache-Control":"no-store"}}); }
