import { fetchSnapshot } from "../utils/snapshot";
import { sharedResource } from "./sharedResource";

const useSnapshot = sharedResource(fetchSnapshot);

export default useSnapshot;
