import axios from "axios";
import { replace } from "svelte-spa-router";

import { logout } from "./auth";

const base = window.APIURL || "http://localhost:9997"

const api = axios.create({
    baseURL: base
});

api.interceptors.request.use(config => {
    if (localStorage["loggedin"] && localStorage["loggedin"] == "true") {
        let token = localStorage["token"];

        config.headers["Authorization"] = `Basic ${token}`;
    }

    return config;
}, error => {
    return Promise.reject(error);
});

api.interceptors.response.use(response => {
    if (response.headers && response.headers["Session-Token"]) {
        localStorage["token"] = response.headers["Session-Token"];
    }

    return response;
}, error => {
    if (error.message.indexOf("Request failed with status code 498") > -1) {
        logout();
        window.notify("Session expired! Please login again.");
        replace("/");
        return null;
    }
    return Promise.reject(error);
})

export default api;