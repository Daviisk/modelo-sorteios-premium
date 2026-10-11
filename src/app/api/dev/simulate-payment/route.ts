import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({error:"Pagamentos e simulações desativados nesta demonstração."},{status:403,headers:{"Cache-Control":"no-store"}}); }
