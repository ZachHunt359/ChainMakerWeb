import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { loadChain, uploadChain } from "~/db.server";
import { exportChainFragment } from "~/jumpchain/ImportExport";
import importV1Chain from "~/jumpchain/ImportV1";

export async function action({
  request,
}: ActionFunctionArgs) {
  const body = await request.formData();
  let chain = body.get("chain");
  let chainId = body.get("chainId");
  if (typeof chain == "string" || typeof chainId != "string")
    return json({error: "YESSS"});
  let doc = await loadChain(chainId);
  doc.chain = JSON.parse(await (chain as File).text());
  doc.edits++;
  doc.save();
  return json({edits: doc.edits});
}

