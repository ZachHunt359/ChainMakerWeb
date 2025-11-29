import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { deleteChain, loadChain, updateChain, uploadChain } from "~/db.server";
import { promises as fs, existsSync } from "fs";
import path from "path";
import Chain from "~/jumpchain/Chain";

const appRoot = process.cwd();

export async function action({
  request,
}: ActionFunctionArgs) {

  let cleanUpImages = async (chainId: string) => {
    if (!/^[a-zA-Z0-9_-]*$/.test(chainId))
      return;
    try {
      let imageDirectory = path.join(appRoot, "public/user_images", chainId);
      if (!existsSync(imageDirectory)) return;
      fs.rm(imageDirectory, { recursive: true, force: true });
    } catch (e) { console.error(e); }

  }

  const body = await request.json();
  try {
    await deleteChain(body.id);
  } catch {
    return json({ error: "Unknown error encounted while deleting. Please try again." })
  }
  cleanUpImages(body.id);
  return redirect("/");
}
