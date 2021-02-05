function login(token, userObject) {
    localStorage["loggedin"] = true;
    localStorage["token"] = token;
    localStorage["user.id"] = userObject.id;
    localStorage["user.fullname"] = userObject.name;
}

function logout() {
    localStorage["loggedin"] = false;
    localStorage.removeItem("token");

    let userKeys = Object.keys(localStorage).filter(item => item.indexOf("user.") == 0);
    for (let k of userKeys)
        localStorage.removeItem(k);
}

export {
    login, logout
}