import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { loadChain, updateChain, uploadChain } from "~/db.server";
import { promises as fs, existsSync } from "fs";
import path from "path";
import Chain from "~/jumpchain/Chain";

const appRoot = process.cwd();

export async function action({
  request,
}: ActionFunctionArgs) {


  return json({ success: false });
}
