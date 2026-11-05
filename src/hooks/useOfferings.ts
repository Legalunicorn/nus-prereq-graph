import { fetchOfferings } from "../utils/api";
import { sharedResource } from "./sharedResource";

const useOfferings = sharedResource(fetchOfferings);

export default useOfferings;
