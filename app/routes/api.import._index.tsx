import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { uploadChain } from "~/db.server";
import { exportChainFragment } from "~/jumpchain/ImportExport";
import importV1Chain from "~/jumpchain/ImportV1";

export async function action({
  request,
}: ActionFunctionArgs) {
  const body = await request.formData();
  let chain = body.get("chain");
  if (typeof chain == "string")
    return json({});
  else {
    let rawChain = JSON.parse(await (chain as File).text());
    if (rawChain[1] && rawChain[1].VersionNumber == "1.0")
      rawChain = JSON.parse(exportChainFragment(importV1Chain(rawChain[1], rawChain[0])));
    let key = await uploadChain(rawChain);
    return redirect(`/chain/${key[0]}`);
  }
}

