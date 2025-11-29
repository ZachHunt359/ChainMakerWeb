import { createReadableStreamFromReadable, LoaderFunctionArgs } from "@remix-run/node";
import { useSearchParams } from "@remix-run/react";
import { loadLegacy } from "~/db.server";
import path from "path";
import { createReadStream } from "fs"


export const loader  = async ({ request }: LoaderFunctionArgs) => {
  let key = new URL(request.url).searchParams.get('key');
  if (!key) return new Response("Invalid access key");
  let doc = await loadLegacy(key);
  if (!doc) return new Response("Invalid access key");

  let legacyDataFile = path.join(process.cwd(), "/legacyUserData/", doc.fileName!);

  const file = createReadableStreamFromReadable(
    createReadStream(legacyDataFile),
  );

  return new Response(file, {
    headers: {
      'Content-Disposition': `attachment; filename="${key}_backup.json"`,
      'Content-Type': 'application/json',
    },
  });
};
