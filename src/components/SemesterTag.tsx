import useOfferings from "../hooks/useOfferings";
import { ACAD_YEAR_LABEL } from "../utils/api";
import { isOffered, semesterLabel } from "../utils/offerings";
import "./SemesterTag.css";

export default function SemesterTag({ code }: { code: string }) {
    const offerings = useOfferings();
    if (!offerings) return null;
    const offered = isOffered(offerings, code);
    return (
        <span className={`semester-tag ${offered ? "" : "not-offered"}`} title={`NUSMods data for ${ACAD_YEAR_LABEL}`}>
            {semesterLabel(offerings, code)}
        </span>
    );
}
