import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { loadLegacy, uploadChain } from "~/db.server";
import { exportChainFragment, importChain } from "~/jumpchain/ImportExport";
import importV1Chain from "~/jumpchain/ImportV1";
import { promises as fs } from "fs"
import path from "path"

export async function action({
  request,
}: ActionFunctionArgs) {
  const body = await request.formData();
  let accessCode = body.get("accessKey");
  if (typeof accessCode != "string")
    return json({});
  let match = accessCode.match(/^[a-zA-Z\d]+$/g);
  if (!match) {
    return json({
      error: "Malformmed access code. Please enter the alphanumeric string which follows the final forwards slash of your edit link."
    });
  }
  try {
    let doc = await loadLegacy(match[0]);
    if (!doc)
      return json({ error: "Chain Not Found!" });
    if (doc.migrated) {
      return json({ success: "Chain has already been migrated. Redirecting you.", access: doc.migrated });
    }
    let legacyDataFile = path.join(process.cwd(), "/legacyUserData/", doc.fileName!);
    let rawChain = JSON.parse(await fs.readFile(legacyDataFile, 'utf8'));
    let chain = importV1Chain(rawChain[1], rawChain[0]);
    let [newId,] = await uploadChain(JSON.parse(exportChainFragment(chain)));
    doc.migrated = newId;
    doc.save();
    return json({ success: "Chain successfully migrated! Redirecting you.", access: newId });
  } catch (e) {
    return json({ error: "Unknown" })
  }


}
