import { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { Form, json, Link, MetaFunction, Outlet, useFetcher, useLoaderData, useLocation, useNavigate, useNavigation, useOutletContext, useParams, useSubmit } from "@remix-run/react";
import { createContext, createRef, FunctionComponent, MutableRefObject, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { toast, ToastContainer, Zoom } from "react-toastify";
import CheckBox from "~/components/Checkbox";
import Multiselect from "~/components/Multiselect";
import { loadChain } from "~/db.server";
import Chain from "~/jumpchain/Chain";
import { exportChainFragment, importChain } from "~/jumpchain/ImportExport";
import { JumpExportParams } from "~/jumpchain/Jump";
import LayoutManager, { MarkupFragment, MarkupMode } from "~/jumpchain/LayoutManager";
import { GID, Id } from "~/jumpchain/Types";
import { GlobalSettings } from "~/root";

export const loader = async (request: LoaderFunctionArgs) => {
    let chainId = request.params.chain;
    let doc = await loadChain(chainId!);
    if (!doc)
        throw new Response(null, {
            status: 404,
            statusText: "Not Found",
        });
    return json({ chain: doc.chain!, edits: doc.edits! });
};

export const meta: MetaFunction<typeof loader> = ({
    data,
}) => {
    return [{ title: `${data?.chain?.name + " | " || ""}ChainMaker` }];
};


export type ClipboardData = {
    purchase: Object;
    key: string;
    originalJump: Id<GID.Jump>
};

export const rerenderTitleContext = createContext<() => void>(() => { });
export const purchaseClipboardContext = createContext<MutableRefObject<ClipboardData[]>>({ current: [] });

let ExportJSONButton: FunctionComponent<{ chain: Chain }> = ({ chain }) => {
    let [file, setFile] = useState<File>(new File([""], ""));
    let [counter, setCounter] = useState(0);
    let aRef = createRef<HTMLAnchorElement>();

    useEffect(() => {
        if (counter > 0) aRef.current?.click();
    }, [counter]);

    return <>
        <a href={URL.createObjectURL(file)} download={file.name} ref={aRef} />
        <div className="row clickable extra-roomy-cell image-highlight-h text-highlight-h" onClick={
            () => {
                let fileName = (chain.name ? chain.name : "UntitledChain").replace(/[^-._~\/\?#\[\]@!$&'\(\)\*\+,;=a-zA-Z0-9 ]/g, '_') + ".json";
                setFile(new File([exportChainFragment(chain)], fileName, { type: "application/json" }));
                setCounter((x) => { return x + 1 });
            }
        }>
            <img className="big-icon" src="/icons/download.svg"></img>
            <span className="vcentered">Export JSON</span>
        </div>

    </>
}

let ExportTextButton: FunctionComponent<{ chain: Chain, imperial: boolean, mode: MarkupMode, exportParams: JumpExportParams, target: ExportTarget, brevity: boolean }>
    = ({ chain, mode, exportParams, target, brevity, imperial }) => {
        let [file, setFile] = useState<File>(new File([""], ""));
        let [counter, setCounter] = useState(0);
        let aRef = createRef<HTMLAnchorElement>();

        let params = useParams();
        let actualCharId = Number(params.charId!);
        let jumpId = Number(params.jId);


        useEffect(() => {
            if (counter > 0) aRef.current?.click();
        }, [counter]);

        return <>
            <a href={URL.createObjectURL(file)} download={file.name} ref={aRef} />
            <input type="submit" className="spanning clickable roomy-cell subtle-rounded mild-outline center-text-align medium-highlight" value={"Export"}
                onClick={
                    () => {
                        let layout = new LayoutManager();
                        layout.markupMode = mode;
                        layout.abbreviate = brevity;
                        let fileName: string = "";
                        let body: MarkupFragment = [];
                        switch (target) {
                            case ExportTarget.CurrentJump:
                                fileName = `${chain.jumps[jumpId].name} [${chain.characters[actualCharId].name || "Character"}]`;
                                body = chain.requestJump(jumpId).exportForDisplay(actualCharId, exportParams, imperial);
                                break;
                            case ExportTarget.AllJumps:
                                fileName = `${chain.characters[actualCharId].name || "Character"}'s Journey`;
                                body = chain.jumpList.filter(jId => chain.jumps[jId].characters.has(actualCharId)).map((jId) => [
                                    chain.requestJump(jId).exportForDisplay(actualCharId, exportParams, imperial),
                                    { hrule: true }
                                ]);
                                break;
                            case ExportTarget.CharacterSummary:
                                break;
                        }

                        fileName = fileName.replace(/[^-._~\/\?#\[\]@!$&'\(\)\*\+,;=a-zA-Z0-9 ]/g, '_') + ".txt";
                        setFile(new File([layout.exportFragment(body)], fileName));
                        setCounter((x) => { return x + 1 });
                    }
                } />
        </>
    }


enum ExportTarget {
    CurrentJump,
    AllJumps,
    CharacterSummary
}

export default function Index() {

    const navigate = useNavigate();
    const loadIndicator = useNavigation();
    const location = useLocation();
    let saveFetcher = useFetcher<(a: ActionFunctionArgs) => TypedResponse<{
        success?: string,
        error?: string,
        edits?: number,
        editRace?: boolean
    }>
    >();

    let loaded = useRef(false);
    let editsRef = useRef(0);
    let editRace = useRef(false);

    let clipboardData = useRef<ClipboardData[]>([]);

    const [settings, setSettings] = useState<GlobalSettings>({ autosave: true, theme: "blue", fontSize: 1, imperialUnits: true, compact: false });

    const rerender = useOutletContext<() => void>();

    let updateSettings = (s: GlobalSettings) => {
        localStorage.setItem("settings", JSON.stringify(s));
        setSettings(s);
        rerender();
    }

    useEffect(() => {
        if (localStorage.getItem("settings"))
            setSettings(JSON.parse(localStorage.getItem("settings")!));
        else {
            setSettings({ ...settings, theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)') ? "neon" : "blue" });
        }
        loaded.current = true;
    }, []);

    const [chain, setChain] = useState<Chain | undefined>();
    const [currentOverlay, setCurrentOverlay] = useState<"save" | "export" | "settings" | undefined>(undefined);
    const [exportParams, setExportParams] = useState<{ mode: MarkupMode, params: JumpExportParams }>({ mode: MarkupMode.HTML, params: {} });
    const [brevity, setBrevity] = useState(false);
    const [singleJumpExport, setSingleJumpExport] = useState(true);
    const [, setCounter] = useState<number>(0);
    let params = useParams();
    let chainId = params.chain!;
    let actualCharId = params.charId;
    let jumpId = params.jId;

    useEffect(() => {
        if (location.pathname !== '/' && location.pathname.slice(-1)[0] === '/') {
            navigate(`${location.pathname.slice(0, -1)}${location.search}${location.hash}`, { state: location.state, replace: true });
        }
    }, [location]);


    useEffect(() => {
        if (!chain) return;
        let storageEntry = { name: chain.name, id: chainId };
        if (!localStorage.getItem("recentChains")) {
            localStorage.setItem("recentChains", JSON.stringify([storageEntry]));
            return;
        }
        let recentChains = JSON.parse(localStorage.getItem("recentChains")!) as { name: string, id: string }[];
        let index = recentChains.findIndex(({ id }) => id == chainId);
        if (index >= 0) recentChains = recentChains.filter(({ id }) => id != chainId);
        else if (recentChains.length > 8) recentChains.pop();
        recentChains.unshift(storageEntry);
        localStorage.setItem("recentChains", JSON.stringify(recentChains));
    }, [chain, chain?.name, chainId]);

    let save = () => {
        if (!chain || !chain.manager.updates.length || saveFetcher.state != "idle") return;
        console.log("Saving");
        if (!editRace.current) {
            saveFetcher.submit({
                id: chainId,
                updates: JSON.parse(JSON.stringify(chain.manager.compileUpdates(chain))),
                edits: editsRef.current || 0
            },
                {
                    action: "/api/update",
                    method: "POST",
                    encType: "application/json"
                }
            );
        } else {
            let data = new FormData();
            data.append("chain", new Blob([exportChainFragment(chain)]));
            data.append("chainId", chainId);
            saveFetcher.submit(data, {
                action: "/api/overwrite",
                method: "post",
                encType: "multipart/form-data",
                navigate: false
            });
        }
    }

    useEffect(() => {
        if (saveFetcher.state == "idle" && saveFetcher.data && chain) {
            if (saveFetcher.data.success) {
                chain.manager.updates = [];
                editsRef.current++;
            }
            if (saveFetcher.data.error) {
                toast.error(saveFetcher.data.error, {
                    position: "top-center",
                    autoClose: 7000,
                    hideProgressBar: true,
                });
            }
            if (saveFetcher.data.editRace) {
                updateSettings({ ...settings, autosave: false });
                editRace.current = true;
            }
            if (saveFetcher.data.edits) {
                editRace.current = false;
                editsRef.current = saveFetcher.data.edits;
                chain.manager.updates = [];
            }
        }
    }, [saveFetcher.state, saveFetcher.data]);

    useEffect(() => {
        if (!chain || !settings.autosave) return;
        let s = setInterval(() => {
            save();
        }, 60000);
        return () => {
            clearInterval(s);
        }
    }, [settings.autosave]);

    if (!chain) {
        const { chain, edits } = useLoaderData<typeof loader>();
        editsRef.current = edits;
        setChain(importChain(chain));
        return <></>;
    }

    let charId = Number(params.charId || (chain && chain.characterList[0]));

    let openMenu: ReactNode;

    switch (currentOverlay) {
        case "export":
            openMenu = <div className="right-weighted-column" >
                <ExportJSONButton chain={chain} />
                {actualCharId === undefined ? [] : <>
                    <div className="spanning compact-cell">
                        <div className="center-text-align large-text bold mild-outline-top extra-roomy-cell">Export For Display</div>
                    </div>
                    <div className="horizontally-roomy spanning">
                        <Multiselect name={"target"} options={jumpId ? {
                            [ExportTarget.AllJumps]: { name: "All Jumps" },
                            [ExportTarget.CurrentJump]: { name: "Current Jump" }
                        } : {
                            [ExportTarget.AllJumps]: { name: "All Jumps" },
                        }} value={jumpId && chain.requestJump(Number(jumpId)).characters.has(charId) ? {
                            [ExportTarget.AllJumps]: !singleJumpExport,
                            [ExportTarget.CurrentJump]: singleJumpExport
                        } : {
                            [ExportTarget.AllJumps]: true,
                        }}
                            onChange={(data) => {
                                setSingleJumpExport(!data[ExportTarget.AllJumps])
                            }}
                            width="100%"
                            single />
                    </div>
                    <div className="horizontally-roomy spanning">
                        <Multiselect name={"brevity"} options={{
                            0: { name: "Abbreviated" },
                            1: { name: "Verbose" },
                        }} value={{
                            0: brevity,
                            1: !brevity,
                        }}
                            width="100%"
                            single
                            onChange={(data) =>
                                setBrevity(!!data[0])
                            }
                        />
                    </div>
                    <div className="horizontally-roomy spanning">
                        <Multiselect name={"format"} options={{
                            [MarkupMode.BBCode]: { name: "BBCode" },
                            [MarkupMode.Markdown]: { name: "Reddit" },
                            [MarkupMode.HTML]: { name: "HTML" },
                            [MarkupMode.Plaintext]: { name: "Plaintext" },
                        }} value={{
                            [MarkupMode.BBCode]: exportParams.mode == MarkupMode.BBCode,
                            [MarkupMode.Markdown]: exportParams.mode == MarkupMode.Markdown,
                            [MarkupMode.HTML]: exportParams.mode == MarkupMode.HTML,
                            [MarkupMode.Plaintext]: exportParams.mode == MarkupMode.Plaintext
                        }} title="Format"
                            width="100%"
                            single
                            onChange={(data) =>
                                setExportParams((p) => { return { params: p.params, mode: Number(Object.keys(data).find(key => !!data[key])) }; })}
                        />
                    </div>
                    <div className="vspaced-half-big spanning center-text-align bold">Optional Components:</div>
                    <div className="row clickable" onClick={() => {
                        setExportParams((p) => {
                            return { mode: p.mode, params: { ...p.params, listAltForms: !p.params.listAltForms } };
                        });
                    }}
                        style={
                            chain.chainSettings.altForms ?
                                {} : { display: "none" }
                        }>

                        <span className="right-align-self">
                            <CheckBox
                                name={"altformExport"}
                                value={!!exportParams.params.listAltForms}
                                onChange={(data) => { setExportParams((p) => { return { mode: p.mode, params: { ...p.params, listAltForms: data } }; }); return undefined; }}
                            />
                        </span>
                        <span className={exportParams.params.listAltForms ? "" : "faint-text"}>Alt-Forms</span>
                    </div>
                    <div className="row clickable" onClick={() => {
                        setExportParams((p) => {
                            return { mode: p.mode, params: { ...p.params, listNarrative: !p.params.listNarrative } };
                        });
                    }}
                        style={
                            chain.chainSettings.narratives == "enabled" ||
                                (chain.characters[charId].primary && chain.chainSettings.narratives == "restricted") ?
                                {} : { display: "none" }
                        }>
                        <span className="right-align-self">
                            <CheckBox
                                name={"narrativesExport"}
                                value={!!exportParams.params.listNarrative}
                            />
                        </span>
                        <span className={exportParams.params.listNarrative ? "" : "faint-text"}>Narratives</span>
                    </div>
                    <div className="row clickable" onClick={() => {
                        setExportParams((p) => {
                            return { mode: p.mode, params: { ...p.params, listChainDrawbacks: !p.params.listChainDrawbacks } };
                        });
                    }}>

                        <span className="right-align-self">
                            <CheckBox
                                name={"chainDrawbackExport"}
                                value={!!exportParams.params.listChainDrawbacks}
                            />
                        </span>
                        <span className={exportParams.params.listChainDrawbacks ? "" : "faint-text"}>Chain Drawbacks</span>
                    </div>
                    <div className="row clickable" onClick={() => {
                        setExportParams((p) => {
                            return { mode: p.mode, params: { ...p.params, listSupplementPurchases: !p.params.listSupplementPurchases } };
                        });
                    }}>
                        <span className="right-align-self">
                            <CheckBox
                                name={"chainSupplementExport"}
                                value={!!exportParams.params.listSupplementPurchases}
                            />
                        </span>
                        <span className={exportParams.params.listSupplementPurchases ? "" : "faint-text"}>Chain Supplements</span>
                    </div>
                    <div className="spanning roomy-cell" style={{ marginTop: "0.5rem" }}>
                        <ExportTextButton
                            chain={chain}
                            mode={exportParams.mode}
                            exportParams={exportParams.params}
                            brevity={brevity}
                            imperial={settings.imperialUnits}
                            target={singleJumpExport ? ExportTarget.CurrentJump : ExportTarget.AllJumps}
                        />
                    </div></>}
            </div>;
            break;
        case "save":
            openMenu = <div className="right-weighted-column" >
                <div className="row clickable extra-roomy-cell image-highlight-h text-highlight-h" onClick={save}>
                    {saveFetcher.state == "idle" ?
                        <img className="big-icon" src="/icons/floppy-disk.svg"></img>
                        :
                        <div className="big-icon loader" />
                    }
                    <span className="vcentered">Save Now</span>
                </div>
                <div className="row clickable extra-roomy-cell" onClick={
                    () => {
                        updateSettings({ ...settings, autosave: !settings.autosave });
                    }
                }>
                    <span className="big-icon vcentered">
                        <CheckBox name={"autosave"} value={settings.autosave} />
                    </span>
                    <span className={`vcentered ${settings.autosave ? "" : "faint-text"}`}>Autosave {settings.autosave ? "Enabled" : "Disabled"}</span>
                </div>
            </div>;
            break;

        case "settings":
            openMenu = <div className="right-weighted-column roomy-cell" >
                <div className="row compact-cell">
                    <span className="vcentered right-align-self">Units:</span>
                    <Multiselect name={"imperial"}
                        options={{ 0: { name: "Metric" }, 1: { name: "Imperial" } }}
                        value={{ 0: !settings.imperialUnits, 1: settings.imperialUnits }}
                        onChange={(data) =>
                            updateSettings({ ...settings, imperialUnits: !!data["1"] })
                        }
                        single
                    />
                </div>
                <div className="row compact-cell">
                    <span className="vcentered right-align-self">Theme:</span>
                    <Multiselect name={"theme"} key={`${settings.theme}_theme`}
                        options={{
                            0: { name: "Neon" },
                            1: { name: "Autumn" },
                            2: { name: "Lavender" },
                            3: { name: "Arctic" }
                        }}
                        value={{
                            0: settings.theme == "neon",
                            1: settings.theme == "autumn",
                            2: settings.theme == "lavender",
                            3: settings.theme == "blue"
                        }}
                        onChange={(data) => {
                            let theme = ["neon", "autumn", "lavender", "blue"][Number(Object.keys(data).find(a => !!data[a]))] as ("autumn" | "neon" | "lavender" | "blue")
                            updateSettings({ ...settings, theme: theme })
                        }
                        }
                        single
                    />
                </div>
                <div className="row compact-cell">
                    <span className="vcentered right-align-self">Scale:</span>
                    <input type="range" style={{ outline: "none", width: "6rem" }}
                        min={0.8}
                        max={1.2}
                        step={0.05}
                        defaultValue={settings.fontSize}
                        onMouseUp={(e) => {
                            updateSettings({ ...settings, fontSize: e.currentTarget.valueAsNumber })
                        }}
                        onTouchEnd={(e) => {
                            updateSettings({ ...settings, fontSize: e.currentTarget.valueAsNumber })
                        }}

                    />
                </div>
                <div className="row compact-cell" onClick={
                    () => {
                        updateSettings({ ...settings, compact: !settings.compact });
                    }
                }>
                    <span className="vcentered right-align-self">Compact:</span>
                    <span className="big-icon vcentered">
                        <CheckBox name={"compact"} value={settings.compact} />
                    </span>
                </div>

            </div>;
            break;

        default:
            openMenu = [];
    }

    return !loaded.current ? [] : (<>
        {chain ? <rerenderTitleContext.Provider value={rerender}>
            <purchaseClipboardContext.Provider value={clipboardData}>
                {currentOverlay ? <div className="full-overlay" onClick={() => setCurrentOverlay(undefined)}>

                </div> : []}
                <header className="bottom-hrule flex-left neutral-highlight">
                    <a href="/">
                        <div className="logo-text tall-cell horizontally-roomy vcentered center-text-align logo-highlight narrow-column">
                            ChainMaker
                        </div>
                    </a>
                    <div className="hcenter-up-mobile">
                        <div className="tall-cell right-vrule horizontally-roomy vcentered large-text">
                            {chain.name}
                        </div>
                        <div>
                            <div className="large-text right-vrule" style={{ display: "flex", height: "100%" }}>
                                <div className={`tall-cell horizontally-roomy vcentered clickable neutral-button large-text super-overlay ${currentOverlay == "save" ? "text-highlight image-highlight" : ""}`}
                                    onClick={() => setCurrentOverlay((c) => c ? undefined : "save")}
                                >
                                    {saveFetcher.state == "idle" ?
                                        <img className="medium-icon" src="/icons/floppy-disk.svg"></img>
                                        :
                                        <div className="medium-icon loader" />
                                    }
                                    <span className="no-mobile">Save</span>
                                </div>

                                <div className={`tall-cell horizontally-roomy vcentered clickable neutral-button large-text super-overlay ${currentOverlay == "export" ? "text-highlight image-highlight" : ""}`}
                                    onClick={() => setCurrentOverlay((c) => c ? undefined : "export")}
                                >
                                    <img className="medium-icon" src="/icons/download.svg"></img>
                                    <span className="no-mobile">Export</span>
                                </div>
                                <div className={`tall-cell horizontally-roomy vcentered clickable neutral-button large-text super-overlay ${currentOverlay == "settings" ? "text-highlight image-highlight" : ""}`}
                                    onClick={() => setCurrentOverlay((c) => c ? undefined : "settings")}
                                >
                                    <img className="medium-icon" src="/icons/settings.svg"></img>
                                </div>
                            </div>
                            {
                                currentOverlay ?
                                    <div className="out-of-flow neutral-highlight mild-outline-b overlay" style={{ right: 0, left: 0 }}>
                                        {openMenu}
                                    </div>
                                    : []
                            }
                        </div>
                    </div>


                    <Link to={`/chain/${chainId}/${charId}/jump/${chain.jumpList[0]}`} className={`tall-cell horizontally-roomy vcentered clickable neutral-button ${location.pathname.includes("jump") ? "active-button" : ""}`}>
                        Jump Itinerary
                    </Link>
                    <Link to={`/chain/${chainId}/${charId}/summary`} className={`tall-cell horizontally-roomy vcentered clickable neutral-button ${location.pathname.includes("summary") ? "active-button" : ""}`}>
                        Traveler Manifest
                    </Link>
                    <Link to={`/chain/${chainId}/${charId}/items`}
                        className={`tall-cell horizontally-roomy vcentered clickable neutral-button ${location.pathname.includes("items") ? "active-button" : ""}`}>
                        Cosmic Cache
                    </Link>
                    <Link to={`/chain/${chainId}/config`}
                        className={`tall-cell horizontally-roomy vcentered clickable neutral-button ${!location.pathname.includes("jump") && location.pathname.includes("config") ? "active-button" : ""}`}>
                        Chain Settings
                    </Link>


                </header>
                <Outlet context={chain} />
                {
                    loadIndicator.state == "loading" ?
                        < div style={{ position: "fixed", left: "0", right: "0", top: "0", height: "6px" }} className="bright-highlight stretch-loader" />
                        : []
                }
            </purchaseClipboardContext.Provider>
        </rerenderTitleContext.Provider >
            : []

        }</>
    );
}
