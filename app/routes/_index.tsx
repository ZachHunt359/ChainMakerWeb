import { ActionFunctionArgs, TypedResponse } from "@remix-run/node";
import { Form, useFetcher, useNavigate, useNavigation, useSubmit } from "@remix-run/react";
import { createRef, FunctionComponent, ReactNode, useEffect, useState } from "react";
import { toast } from "react-toastify";
import CheckBox from "~/components/Checkbox";

export const meta = () => {
  return [{ title: `ChainMaker | Jumpchain Character Sheet` }];
};

let BackupLocalChainButton: FunctionComponent<{}> = () => {
  let [file, setFile] = useState<File>(new File([""], ""));
  let [counter, setCounter] = useState(0);
  let aRef = createRef<HTMLAnchorElement>();

  useEffect(() => {
    setFile(
      new File(
        [`[${localStorage.getItem("unusedID")},${localStorage.getItem("chainDump")}]`],
        "local_backup.json"
      )
    );
    if (counter > 0) aRef.current?.click();
  }, [counter]);

  return (
    <>
      <a
        href={URL.createObjectURL(file)}
        download={file.name}
        ref={aRef}
        style={{ display: "none" }}
      />
      <div
        className="hcenter-down image-highlight-h text-highlight-h"
        onClick={() => {
          setCounter((x) => {
            return x + 1;
          });
        }}
      >
        <img className="medium-square" src="/icons/download.svg" />
        <span>Backup</span>
      </div>
    </>
  );
};

export default function Index() {
  let [recent, setRecent] = useState<{ name: string; id: string }[] | undefined>(undefined);
  let [useReality, setUseReality] = useState<boolean>(true);
  let [useBodyMod, setUseBodyMod] = useState<boolean>(true);
  let [currentTab, setTab] = useState<"new" | "importing" | undefined>(undefined);
  let [localChain, setLocalChain] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("recentChains"))
      setRecent(JSON.parse(localStorage.getItem("recentChains")!));
  }, []);

  let iRef = createRef<HTMLInputElement>();
  let formRef = createRef<HTMLFormElement>();
  let accessCodeRef = createRef<HTMLInputElement>();
  let jsonImportFetcher = useFetcher();
  let accessKeyMigrationFetcher = useFetcher<
    (a: ActionFunctionArgs) => TypedResponse<{
      success?: string;
      error?: string;
      access?: string;
    }>
  >();
  let localMigrationFetcher = useFetcher();

  let navigate = useNavigate();
  let navigation = useNavigation();

  useEffect(() => {
    if (localStorage.getItem("chainDump") && localStorage.getItem("unusedID")) {
      setLocalChain(true);
    }
  }, []);

  useEffect(() => {
    if (localMigrationFetcher.state == "loading") {
      localStorage.removeItem("chainDump");
      localStorage.removeItem("unusedID");
    }
  }, [localMigrationFetcher.data, localMigrationFetcher.state]);

  let openTab: ReactNode;
  if (currentTab == "new") {
    openTab = (
      <div className="extra-roomy-cell mild-outline rounded-rect neutral-highlight vspaced-big">
        <div className="logo-text vspaced center-text-align">Create New Chain</div>
        <div className="right-weighted-column extra-roomy-cell">
          <div className="container">
            <span className="bold vcentered right-align-self">Chain Name:</span>{" "}
            <input
              className="compact-cell"
              defaultValue="[untitled chain]"
              autoFocus
              name="title"
              data-form-field="title"
            />
            <span className="bold vcentered right-align-self">Jumper Name:</span>{" "}
            <input className="compact-cell vspaced" defaultValue="Jumper" name="jumper" data-form-field="jumper" />
            <span className="bold vcentered right-align-self">Name of First Jump:</span>{" "}
            <input className="compact-cell" defaultValue="[untitled jump]" name="jump" data-form-field="jump" />
            <span className="bold vcentered right-align-self">Jumpdoc URL:</span>{" "}
            <input
              className="compact-cell vspaced"
              defaultValue=""
              placeholder="optional"
              name="jumpURL"
              data-form-field="jumpURL"
            />
            <div
              className="vcentered center-text-align row clickable"
              onClick={() => setUseReality((a) => !a)}
            >
              <span className="right-align-self">
                <input type="checkbox" checked={useReality} onChange={() => {}} data-form-field="warehouseMod" />
              </span>
              <span className="roomy-cell vcentered">
                Use&nbsp;
                <a
                  className="text-highlight underline-h"
                  href="https://docs.google.com/document/d/1yewhouqLvhI9LyFuK6ihZ1JAVX8AvGYb7CDJ1CVihtY/view"
                  target="_blank"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {" "}
                  Personal Reality Supplement
                </a>
              </span>
            </div>
            <div
              className="vcentered center-text-align clickable row"
              onClick={() => setUseBodyMod((a) => !a)}
            >
              <span className="right-align-self">
                <input type="checkbox" checked={useBodyMod} onChange={() => {}} data-form-field="bodyMod" />
              </span>
              <span className="roomy-cell vcentered">
                Use&nbsp;
                <a
                  className="text-highlight underline-h"
                  href="https://drive.google.com/file/d/1V9bPZTOgQ4VS9YJiEwEkabaX4GHzyiRf/view"
                  target="_blank"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {" "}
                  Essential Body Mod
                </a>
              </span>
            </div>
            <div></div>
            <button
              type="button"
              className="clickable roomy-cell subtle-rounded mild-outline center-text-align medium-highlight"
              onClick={() => {
                // Create form and submit directly - completely bypass Remix
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/api/new';
                form.style.display = 'none';
                
                // Get all input values
                const inputs = document.querySelectorAll('[data-form-field]');
                inputs.forEach((element: any) => {
                  const input = document.createElement('input');
                  input.type = 'hidden';
                  input.name = element.getAttribute('data-form-field');
                  
                  if (element.type === 'checkbox') {
                    input.value = element.checked ? '1' : '0';
                  } else {
                    input.value = element.value || '';
                  }
                  
                  form.appendChild(input);
                });
                
                document.body.appendChild(form);
                form.submit();
              }}
            >
              Create!
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    openTab = [];
  }

  return (
    <>
      <span
        className="logo-text logo-highlight extra-roomy-cell rounded-rect mild-outline vspaced"
        style={{ alignSelf: "center", boxShadow: "none", marginTop: "6rem" }}
      >
        ChainMaker
      </span>
      <Form method="POST" action="/api/import" className="container" encType="multipart/form-data">
        <input
          type="file"
          ref={iRef}
          name="chain"
          style={{ display: "none" }}
          accept=".json"
          onChange={(e) => {
            jsonImportFetcher.submit(e.currentTarget.form, {
              method: "POST",
              navigate: true,
            });
          }}
        />
      </Form>
      <div
        style={{ alignSelf: "center", maxWidth: "45rem" }}
        className="large-text extra-roomy-cell hcenter-down"
      >
        {navigation.state != "idle" ? (
          <div className="hcenter-down">
            <div className="big-square loader" style={{ alignSelf: "center" }} />
          </div>
        ) : (
          <>
            <div className="flex-even" style={{ width: "min-content", alignSelf: "center" }}>
              <div
                className={`extra-roomy-cell big-square margins ${
                  currentTab == "new" ? "heavy-medium" : "faint-text mild"
                }-outline rounded-rect neutral-highlight clickable`}
                onClick={() => setTab((tab) => (tab == "new" ? undefined : "new"))}
              >
                <img src="/icons/multiple-pages-plus.svg" className="icon-light-no-h" />
                New Chain
              </div>
              <div
                className="extra-roomy-cell margins big-square mild-outline rounded-rect neutral-highlight clickable faint-text"
                onClick={() => {
                  iRef.current!.click();
                }}
              >
                {jsonImportFetcher.state == "idle" ? (
                  <img src="/icons/upload.svg" className="icon-light-no-h" />
                ) : (
                  <div className="loader" />
                )}
                Import Chain
              </div>
            </div>
            <div className="hcenter-down">
              {openTab}
              {recent && recent.length ? (
                <div
                  className="extra-roomy-cell fixed-top-right mild-outline rounded-rect faint-highlight faint-text vspaced"
                  style={{ maxWidth: "16rem" }}
                >
                  <div className="bold center-text-align">Recently Viewed Chains:</div>
                  {recent.map(({ name, id }) => (
                    <div className="roomy-cell" key={id}>
                      <a href={`chain/${id}`} className="text-highlight underline-h">
                        {name}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                []
              )}
            </div>
          </>
        )}

        <div style={{ textAlign: "justify", lineHeight: "1.5rem" }}>
          <div className="bold center-text-align logo-text vspaced-big roomy-cell">General FAQ</div>
          <div className="bold center-text-align faint-text vspaced-half-big">
            What is Jumpchain?
          </div>
          <div className="faint-text">
            At heart, <span className="bold">Jumpchain</span> is a character building tool, in which
            you design a <span className="bold">"Jumper"</span>, an inter-dimensional hopper who
            journeys from universe to universe, developing tremendous abilities and accumulating
            great power as they go along.
            <br />
            <br />
            Each stop along the way is a <span className="bold">jump</span>, representing a single
            world or universe visited by your Jumper. Each jump has an accompanied{" "}
            <span className="bold">jumpdoc</span>, a document created by a member of the community
            cataloging the powers, abilities, and artifacts you can earn by visiting that world.
            Before entering each Jump you are given a budget with which make purchases from this
            documents, representing the various boons that your Jumper aquires at the beginning of
            that journey. These <span className="bold">perks</span> can range from superpowers to
            assurances of good luck to academic, artistic, or martial skills to almost anything else
            you can conceive of.
            <br />
            <br />
            What happens in each jump varies considerably, and is mostly left up to the imagination
            of the <span className="bold">Chain Author</span> (that's you!). There are a few trends,
            however: most jumps last about 10 years, and the most take place in an existing
            fictional universe, such as "Harry Potter", "Batman: The Animated Series", or "Life is
            Strange".
            <br />
            <br />
            For more information, it's recommended that you check out one of the existing Jumpchain
            communities such as{" "}
            <a
              href="https://www.reddit.com/r/JumpChain/"
              className="text-highlight underline-h"
              target="_blank"
            >
              /r/Jumpchain
            </a>{" "}
            or{" "}
            <a
              href="https://forums.spacebattles.com/forums/roleplaying-ic.60/"
              className="text-highlight underline-h"
              target="_blank"
            >
              SpaceBattles
            </a>
            .
          </div>
          <div className="bold center-text-align faint-text vspaced-half-big">
            What is the ChainMaker webapp?
          </div>
          <div className="faint-text">
            As much as Jumpchain is a story-telling game, it's also a set of systems that the
            community has arrived at for constraining those stories. Those systems can have a lot of
            moving parts (Choice Points, origin discounts, companion imports, body mods, etc) that
            can be somewhat unwieldy to keep track of on your own. And since Jumpchain is inherently
            a game about <i>accumulation</i>, the choices you make within those systems can become
            harder and harder to keep track of as your chain grows past its first few jumps.{" "}
            <span className="bold">ChainMaker</span> is a tool built to organize that chaos: it's
            functionally a big, pre-built spreadsheet designed specifically for keeping track of the
            sorts of systems that reoccur between jumpdocs, as well as providing a tool for sharing
            the builds that you come up with with others in the community.
          </div>
          <div className="bold center-text-align faint-text vspaced-half-big">
            How Do I Get Started?
          </div>
          <div className="faint-text">
            Choose a jumpdoc and fill it out! Seriously, the best way to understand what Jumpchain
            is, is to simply get started and see if it stokes your imagination. Your first jump
            isn't a big time investment and it's easier to see how the pieces interlock into a
            workable system by doing than it is to read about it in the abstract.
            <br />
            <br />A good starting place is to think of an intellectual property that you like and
            look for it in one of the{" "}
            <a
              href="https://docs.google.com/spreadsheets/d/14bLxLtoxgQ74sp6HY8TGJGKHwsRZi3ta17GJBPuhOSw/edit#gid=1608577019"
              className="text-highlight underline-h"
              target="_blank"
            >
              jumplists
            </a>
            . Chances are someone has already made a jumpdoc out of that setting and you can get
            your feet wet by exploring a place that you already know and care about! If you want a
            more curated experience, Quicksilver's{" "}
            <a
              href="https://drive.google.com/file/d/0B1qb0_OLhDrDOFJINXpBcDBXS2s/view?resourcekey=0-_uXKDxwZxFt_BC4Dawy4cA"
              className="text-highlight underline-h"
              target="_blank"
            >
              Pokemon Trainer
            </a>{" "}
            jump is one of the first experiments in the genre and is still considered a great
            starting point.
          </div>

          <div className="bold center-text-align logo-text vspaced-big roomy-cell">
            ChainMaker FAQ
          </div>
          <div className="bold center-text-align faint-text vspaced-half-big">
            What happened to the old app?
          </div>
          <div className="faint-text">
            It's still available{" "}
            <a href="https://thedarkwad.github.io/" className="text-highlight underline-h">
              here
            </a>
            , though you'll to save your chain on your own device (as opposed to the cloud) if you
            want to continue using it.
          </div>

          <div className="bold center-text-align faint-text vspaced-half-big">
            How do I make sure I don't lose my chain?
          </div>
          <div className="faint-text">
            I made a deliberate decision to not implement a login system in the app to avoid
            security issues. Because of this, you should think of the url of your chain like your
            username and password: anyone with the URL can edit your chain, and without it you are
            locked out from even viewing it, unless you contact me directly for recovery. Bookmark
            your chains!
            <br />
            <br />I also recommend frequently exporting your chain to JSON so that you have an
            offline backup. If you have this file, you can always reimport even if you lose the URL.
          </div>
          <div className="bold center-text-align faint-text vspaced-half-big">
            How do I make supplements? What does that strange "subsystem" button do?
          </div>
          <div className="faint-text">
            There is a wide variety of different types of "supplement" in jumpchain, so naturally
            there isn't only one way of representing them in the App. The current state of
            ChainMaker has three distinct systems for "supplements" to an ordinary jump.
            <div className="extra-roomy-cell faint-highlight-no-text mild-outline vspaced subtle-rounded">
              A <span className="bold">Jump Supplement</span> is basically just an ordinary jump
              that is attached to another jump in your chain as an addendum. It has its own pool of
              points, its own origins, its own drawbacks, its own system of companion imports, etc.
              However, jump supplements are treated as the same jump for the purpose of systems
              which accumulate slowly over the course of your chain, such as drawbacks which
              eventually expire, or investment limits for other types of supplements.
            </div>
            <div className="extra-roomy-cell faint-highlight-no-text mild-outline vspaced subtle-rounded">
              <span className="bold">Chain Supplements</span> are systems which follow you through
              you entire chain, giving you the opportunity to invest in them at various points in
              your journey. These typically include things like "Body Mods" or "Warehouse Mods",
              which often include features like accumulating points across multiple jumps, or the
              opportunity to invest CP slowly for accumulating benefits. It is recommended to{" "}
              <i>not</i> use the chain supplement system for systems which are only designed to be
              interacted with during a single jump, since these can clutter up your navigation on
              jumps for which they are not relevant.
            </div>
            <div className="extra-roomy-cell faint-highlight-no-text mild-outline vspaced subtle-rounded">
              Finally, <span className="bold">jump subsystems</span> are a different beast,
              representing components of an individual jump which you would prefer to package
              together to avoid cluttering up your build elsewhere. Think the custom armor or ship
              builders common among superhero and sci-fi jumps, or things like The Fountain's
              biosphere. You probably don't want a dozen durability upgrades for that power armor
              you built popping up everytime you try to scroll through your perk list! Jump
              subsystems appear as tabs in their cooresponding jump, and purchases made in a
              particular subsystem must lie underneath a particular "summary" or "access" perk,
              which is what you see when searching for that particular perk elsewhere. This is also
              where you record the points that you spent to gain access to that subsystem, such as
              the CP that you traded in for the Armor points that you spent, or whatever it is. It
              is recommended to write the description of these "access" perks yourself to properly
              summarize your underlying choices.
            </div>
          </div>
          <div className="bold center-text-align faint-text vspaced-half-big">
            Help! The image upload limit is too small!
          </div>
          <div className="faint-text">
            Although I do provide space for you to upload pictures of your characters and their
            alt-forms, hosting is expensive, and, sadly, I can't commit to operating as a full image
            host. Think of the 1MB per Chain that is available as a conveinience and a courtesy, so
            that you can add a picture or two without having to worry about linking to an external
            service. However, if you have a lot of alt-forms that need portraits, or even just have
            more than one or two particularly high-resolution images, I recommend using a free image
            host (like imgur or Image Chest) and linking directly to the image file on their server.
            If you do this correctly, the image will fully display in the usual spot without cutting
            into any of your allocated hard-drive space.
          </div>
          <div className="vspaced-big"></div>
        </div>
      </div>
    </>
  );
}
