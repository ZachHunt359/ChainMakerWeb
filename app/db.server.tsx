import mongoose, { model, Schema } from "mongoose";
import Chain from "./jumpchain/Chain";
import { exportChainFragment, importChain } from "./jumpchain/ImportExport";
import { Action, Update } from "./jumpchain/DataManager";
import { nanoid } from "nanoid";
import path from "path";
import mysql, { RowDataPacket } from "mysql2/promise"


const chainSchema = new Schema({
    chain: Schema.Types.Mixed,
    accessCode: String,
    createdAt: Date,
    updatedAt: Date,
    edits: Number
}, { minimize: false }
);

const legacySchema = new Schema({
    accessCode: String,
    fileName: String,
    migrated: String
}, { minimize: false }
);

const ChainModel = mongoose.models.Chain || model('Chain', chainSchema);
export const LegacyModel = mongoose.models.LegacyLookup || model('LegacyLookup', legacySchema);

export async function loadLegacy(accessCode: string) {
    return await LegacyModel.findOne({ accessCode: accessCode }).exec();
}

export async function syncWithOriginalServer() {

    const con = await mysql.createConnection({
        host: process.env.LEGACY_MYSQL_HOST || "198.22.162.69",
        user: process.env.LEGACY_MYSQL_USER || "admin",
        password: process.env.LEGACY_MYSQL_PASSWORD || "",
        database: process.env.LEGACY_MYSQL_DATABASE || "jumpchainDB"
    });

    let [rows,] = await con.query<RowDataPacket[]>(
        `SELECT DataPath, AccessKey FROM Chains WHERE EditPermissions = 1`
    );

    let added = 0;
    let skipped = 0;

    for (let row of rows) {
        if (await loadLegacy(row["AccessKey"])) {
            skipped++;
            continue;
        }
        let newDoc = new LegacyModel({
            accessCode: row["AccessKey"],
            fileName: row["DataPath"],
            migrated: ""
        });
        await newDoc.save();
        added++;
    }

    await con.end();

    return { added, skipped, total: rows.length };
}

export async function deleteChain(chainId : string){
    return await ChainModel.deleteOne({ accessCode: chainId }).exec();
}


export async function uploadChain(rawObject: Object): Promise<[id: string, document: InstanceType<typeof ChainModel>]> {
    let doc = new ChainModel({
        chain: rawObject,
        accessCode: nanoid(),
        createdAt: new Date(),
        updatedAt: new Date(),
        edits: 0
    });
    await doc.save();
    return [String(doc.accessCode), doc];
}

export async function checkIfChainExists(accessString: string) {
    return (await ChainModel.countDocuments({ accessCode: accessString }).exec()) > 0;
}

export async function updateChain(updates: (Update & { data?: any })[], document: InstanceType<typeof ChainModel>) {
    document.updatedAt = new Date();
    for (let update of updates) {
        let fields = [...update.dataField];
        let updateLocation = document.chain!;
        if (fields.length == 0) {
            document.chain = update.data!;
        }
        while (fields.length > 1) {
            updateLocation = updateLocation[fields.shift()!]
        }
        if (update.action == Action.Delete)
            delete updateLocation[fields.shift()!]
        else
            updateLocation[fields.shift()!] = update.data;

        document.markModified(["chain", ...update.dataField].join("."));
    }
    document.edits!++;
    await document.save();
}

export async function loadChain(accessString: string) {
    return await ChainModel.findOne({ accessCode: accessString }).exec();
}

export default ChainModel;