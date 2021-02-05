import { GEOCODE_KEY } from "../system/constants";
import axios from "axios";
import api from "../system/api";

const GEOCODE_BASE = "https://api.positionstack.com/v1/"

async function searchFreetext(query:string) {
    let url = GEOCODE_BASE + "forward?access_key=" + GEOCODE_KEY + "&query=";
    url += encodeURIComponent(query);

    let result = await axios.get(url);
    return result.data;
}

export {
    searchFreetext
}