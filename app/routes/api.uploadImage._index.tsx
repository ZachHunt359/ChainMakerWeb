import { ActionFunctionArgs, json, redirect, TypedResponse } from "@remix-run/node";
import { checkIfChainExists, loadChain, updateChain, uploadChain } from "~/db.server";
import { promises as fs, createWriteStream, createReadStream, existsSync } from "fs";
import path from "path";
import Stream from "stream"

const bytesPerChain = 1000000; // 1 MB
const bytesPerChainString = `1 MB`;

const validFileExtensions = ["jpeg", "jpg", "gif", "png", "webp", "jfif"];

const appRoot = process.cwd();

const dirSize = async (directory: string) => {
  const files = await fs.readdir(directory);
  const stats = files.map(file => fs.stat(path.join(appRoot, directory, file)));

  return (await Promise.all(stats)).reduce((accumulator, { size }) => accumulator + size, 0);
}

const makeDirectory = async (directory: string) => {
  if (!existsSync(path.join(appRoot, directory)))
    await fs.mkdir(path.join(appRoot, directory), { recursive: true })
}


const deleteImage = async (directory: string, id: string) => {
  const files = await fs.readdir(directory);
  const file = files.find((f) => path.parse(f).name == id);
  if (!file) return;
  await fs.unlink(path.join(appRoot, directory, file));
}

const validateId = (s: string) => /^[a-zA-Z0-9_-]*$/.test(s);

export async function action({
  request,
}: ActionFunctionArgs): Promise<TypedResponse<{
  success?: string,
  error?: string;
}>> {
  const body = await request.formData();
  let file = body.get('imageFile');
  let chainId = body.get('chainId');
  let altFormId = body.get('altFormId');

  if (typeof file == "string" || file === null || typeof chainId !== "string" || typeof altFormId !== "string") {
    return json({ error: "Invalid request. Please refresh the page and try again." });
  }

  if(!checkIfChainExists(chainId))
    return json({error: "Chain not found."});

  if (!validateId(chainId) || !validateId(altFormId))
    return json({ error: "Invalid request. Please refresh the page and try again." });

  let imageFolder = path.join("public/user_images", String(chainId));
  try {
    await makeDirectory(imageFolder);
    await deleteImage(imageFolder, String(altFormId));
    if (await dirSize(imageFolder) + (file as File).size >= Number(process.env.IMAGE_LIMIT_BYTES)) {
      return json({ error: `Total image uploads would exceed your limit of ${process.env.IMAGE_LIMIT_STRING} per chain. Please delete other images to make room or host new images externally.` });
    }
    let fileExtension = file.name.split(".").pop()!.toLowerCase();
    if (!validFileExtensions.includes(fileExtension))
      return json({ error: `Invalid file extension. Supported extensions are .jpg, .jpeg, .jfif, .gif, .png, and .webp.` });
    let ws = Stream.Writable.toWeb(createWriteStream(path.join(appRoot, imageFolder, `${String(altFormId)}.${fileExtension}`)));
    await file.stream().pipeTo(ws);
    return json({ success: "Image Successfully Uploaded!", error: undefined });
  } catch (error) {
    console.error(error);
    return json({ error: "Server-Side Upload Error. Please try again." });
  }

}