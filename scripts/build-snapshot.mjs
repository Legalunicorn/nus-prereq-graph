// Builds public/data/snapshot.json: every CS and preset module plus their prerequisite chains.
// The app reads this file instead of calling NUSMods for each module in a chain.
// Run once a semester, or after bumping CURR_ACAD_YEAR: npm run snapshot
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CONCURRENCY = 4;
const OUTPUT_DIR = "public/data";
const PRESET_FILES = ["focusAreas", "csFoundation", "csMathAndScience"];

const acadYear = readFileSync("src/constants.ts", "utf8").match(/CURR_ACAD_YEAR = '([^']+)'/)[1];
const apiUrl = path => `https://api.nusmods.com/v2/${acadYear}/${path}`;

function presetCodes() {
    const source = PRESET_FILES.map(file => readFileSync(`src/data/${file}.ts`, "utf8")).join("\n");
    return [...source.matchAll(/code:\s*"([^"]+)"/g)].map(match => match[1]);
}

function treeCodes(tree) {
    if (typeof tree === "string") return [tree.split(":")[0]];
    const children = tree.and ?? tree.or ?? tree.nOf?.[1] ?? (tree.then ? [tree.then] : []);
    return children.flatMap(treeCodes);
}

function expandWildcard(code, catalogue) {
    if (!code.includes("%")) return [code];
    const pattern = new RegExp(`^${code.replaceAll("%", ".*")}$`);
    return catalogue.filter(candidate => pattern.test(candidate));
}

async function fetchModule(code) {
    const res = await fetch(apiUrl(`modules/${encodeURIComponent(code)}.json`));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
    const data = await res.json();
    return {
        title: data.title,
        semesters: data.semesterData.map(semester => semester.semester),
        ...(data.prereqTree && { prereqTree: data.prereqTree }),
    };
}

async function crawl(seeds, catalogue) {
    const modules = {};
    const seen = new Set(seeds);
    const queue = [...seeds];
    let active = 0;

    const worker = async () => {
        while (queue.length > 0 || active > 0) {
            const code = queue.shift();
            if (!code) {
                await new Promise(resolve => setTimeout(resolve, 50));
                continue;
            }
            active++;
            const mod = await fetchModule(code);
            active--;
            if (!mod) continue;
            modules[code] = mod;
            const prereqs = mod.prereqTree ? treeCodes(mod.prereqTree) : [];
            for (const prereq of prereqs.flatMap(c => expandWildcard(c, catalogue))) {
                if (!seen.has(prereq)) {
                    seen.add(prereq);
                    queue.push(prereq);
                }
            }
        }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    return modules;
}

const listRes = await fetch(apiUrl("moduleList.json"));
if (!listRes.ok) throw new Error(`moduleList: HTTP ${listRes.status}`);
const catalogue = (await listRes.json()).map(mod => mod.moduleCode);

const seeds = new Set([...presetCodes(), ...catalogue.filter(code => /^CS\d/.test(code))]);
const modules = await crawl([...seeds], catalogue);

const sorted = Object.fromEntries(Object.entries(modules).sort(([a], [b]) => a.localeCompare(b)));
const snapshot = { acadYear, generatedAt: new Date().toISOString().slice(0, 10), modules: sorted };

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(`${OUTPUT_DIR}/snapshot.json`, JSON.stringify(snapshot));
console.log(`Wrote ${Object.keys(sorted).length} modules for ${acadYear}`);
