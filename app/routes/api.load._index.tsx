import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { loadChain, uploadChain } from "~/db.server";

export async function action({
  request,
}: ActionFunctionArgs) {
  const body = await request.formData();
  let chainId = String(body.get("key"));
  let doc = await loadChain(chainId);
  if (!doc)
    return new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  return json(doc.chain!);
}
