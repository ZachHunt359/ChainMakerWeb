import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { uploadChain } from "~/db.server";
import Chain from "~/jumpchain/Chain";
import ChainSupplement, { CompanionAccess } from "~/jumpchain/ChainSupplement";
import Character from "~/jumpchain/Character";
import { exportChainFragment } from "~/jumpchain/ImportExport";
import Jump from "~/jumpchain/Jump";
import { PurchaseType } from "~/jumpchain/Purchase";

export async function action({
    request,
}: ActionFunctionArgs) {
    const body = await request.formData();

    let title = String(body.get("title"));
    let jumper = String(body.get("jumper"));
    let jumpName = String(body.get("jump"));
    let jumpURL = String(body.get("jumpURL"));
    let warehouseMod = !!Number(body.get("warehouseMod"));
    let bodyMod = !!Number(body.get("bodyMod"));

    let chain = new Chain();
    chain.name = title;
    let j = new Jump(chain);
    j.name = jumpName;
    if (jumpURL.length)
        j.url = jumpURL
    let c = new Character(chain);
    c.primary = true;
    c.name = jumper;

    chain.purchaseCategories[PurchaseType.Perk] = {
        0: "Physical",
        1: "Mental",
        2: "Social",
        3: "Magical",
        4: "Spiritual",
        5: "Skill",
        6: "Crafting",
        7: "Technological",
        8: "Luck",
        9: "Other",
        10: "Meta"
    }

    chain.purchaseCategories[PurchaseType.Item] = {
        0: "Weapons",
        1: "Apparel",
        2: "Equipment",
        3: "Materials",
        4: "Food & Drugs",
        5: "Media",
        6: "Wealth",
        7: "Vehicles",
        8: "Tools",
        9: "Locales",
        10: "Creatures",
        11: "Businesses & Contacts",
        12: "Other"
    }

    if (warehouseMod) {
        let warehouseMod = new ChainSupplement(chain);
        warehouseMod.name = "Personal Reality";
        warehouseMod.itemLike = true;
        warehouseMod.url = "https://docs.google.com/document/d/1yewhouqLvhI9LyFuK6ihZ1JAVX8AvGYb7CDJ1CVihtY/view";
        warehouseMod.currency = "WP";
        warehouseMod.companionAccess = CompanionAccess.Unavailable;
        warehouseMod.perJumpStipend = 50;
        warehouseMod.initialStipend = 500;
        warehouseMod.investmentRatio = 4;
        warehouseMod.maxInvestment = 1000;
        warehouseMod.purchaseCategories = {
            0: "Basics",
            1: "Utilities & Structures",
            2: "Cosmetic Upgrades",
            3: "Facilities",
            4: "Extensions",
            5: "Items & Equipment",
            6: "Companions",
            7: "Miscellaneous",
            8: "Limitations"
        }
    }

    if (bodyMod) {
        let bodyModSupp = new ChainSupplement(chain);
        bodyModSupp.name = "Body Mod";
        bodyModSupp.itemLike = false;
        bodyModSupp.url = "https://drive.google.com/file/d/1V9bPZTOgQ4VS9YJiEwEkabaX4GHzyiRf/view";
        bodyModSupp.currency = "EP";
        bodyModSupp.perJumpStipend = 0;
        bodyModSupp.initialStipend = 100;
        bodyModSupp.investmentRatio = 100;
        bodyModSupp.maxInvestment = 100;
        bodyModSupp.purchaseCategories = {
            0: "Basic",
            1: "Essence",
            2: "Physical",
            3: "Mental",
            4: "Spiritual",
            5: "Skill",
            6: "Supernatural",
            7: "Item",
            8: "Companion",
            9: "Drawback"
        }
    }

    let newID = (await uploadChain(JSON.parse(exportChainFragment(chain))))[0];
    return redirect(`/chain/${newID}`);
}
