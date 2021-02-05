import Auth from "./auth/Auth.svelte";

import DashboardHome from "./dashboard/Home.svelte";
import DashboardManagePUI from "./dashboard/ManagePUI.svelte";
import PUIEditor from "./dashboard/PUIEditor.svelte";
import Checkins from "./dashboard/Checkins.svelte";

import RegCodes from "./users/RegCodes.svelte";

export default {
    '/': Auth,
    '/dashboard': DashboardHome,
    '/dashboard/pui': DashboardManagePUI,
    '/dashboard/pui/new': PUIEditor,
    '/dashboard/pui/:puiID': PUIEditor,
    '/dashboard/users/allow': RegCodes,
    '/dashboard/checkins': Checkins
}