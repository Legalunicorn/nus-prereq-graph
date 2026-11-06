import type { ReactNode } from "react";
import { COLLAPSED_GROUPS_KEY, GROUP_BY_KEY } from "../constants";
import useModuleCredits from "../hooks/useModuleCredits";
import useStoredState from "../hooks/useStoredState";
import { GROUP_OPTIONS, groupMods } from "../plan/moduleGroups";
import type { GroupBy } from "../plan/moduleGroups";
import type { Mod } from "../types/types";

const isGroupBy = (value: unknown): value is GroupBy => typeof value === "string" && value in GROUP_OPTIONS;
const isStringList = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(item => typeof item === "string");

interface ModListProps {
    mods: Mod[];
    renderRow: (mod: Mod) => ReactNode;
}

export default function ModList({ mods, renderRow }: ModListProps) {
    const [groupBy, setGroupBy] = useStoredState<GroupBy>(GROUP_BY_KEY, "level", isGroupBy);
    const [collapsed, setCollapsed] = useStoredState<string[]>(COLLAPSED_GROUPS_KEY, [], isStringList);
    const credits = useModuleCredits(groupBy === "term" ? mods.filter(mod => mod.plannedTerm).map(mod => mod.code) : []);

    const toggleGroup = (key: string) =>
        setCollapsed(collapsed.includes(key) ? collapsed.filter(other => other !== key) : [...collapsed, key]);

    if (mods.length === 0) {
        return null;
    }

    return (
        <>
            <label className="group-by">
                Group by
                <select value={groupBy} onChange={event => setGroupBy(event.target.value as GroupBy)}>
                    {Object.entries(GROUP_OPTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
            </label>
            {groupMods(mods, groupBy, code => credits.get(code) ?? 0).map(group => {
                const key = `${groupBy}:${group.id}`;
                const isCollapsed = collapsed.includes(key);
                return (
                    <section key={key}>
                        <button className="group-heading" aria-expanded={!isCollapsed} onClick={() => toggleGroup(key)}>
                            <span className={isCollapsed ? "group-chevron" : "group-chevron open"} aria-hidden="true">▸</span>
                            {group.label}
                            <span className="group-count">{group.mods.length}</span>
                            {group.credits !== undefined && <span className="group-credits">{group.credits} MC</span>}
                        </button>
                        {!isCollapsed && <ul className="mod-list">{group.mods.map(renderRow)}</ul>}
                    </section>
                );
            })}
        </>
    );
}
