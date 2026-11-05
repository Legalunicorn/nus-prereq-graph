import useOfferings from "../hooks/useOfferings";
import { ACAD_YEAR_LABEL } from "../utils/api";
import { isOffered, semesterLabel } from "../utils/offerings";
import "./SemesterTag.css";

export default function SemesterTag({ code }: { code: string }) {
    const offerings = useOfferings();
    const label = offerings ? semesterLabel(offerings, code) : "";
    if (!offerings || !label) {
        return null;
    }
    const className = isOffered(offerings, code) ? "semester-tag" : "semester-tag not-offered";
    return <span className={className} title={`NUSMods data for ${ACAD_YEAR_LABEL}`}>{label}</span>;
}
