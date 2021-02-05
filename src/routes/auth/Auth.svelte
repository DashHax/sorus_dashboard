<script lang="ts">
    import { onMount } from "svelte";
    import { fade, slide } from "svelte/transition";
    import { Button, TextField } from "smelte";
    import { replace } from "svelte-spa-router";

    import axios from "../../system/api";
    import { login } from "../../system/auth";

    let isDisplay = false;
    let page = 0;

    let isProgress = false;
    let loginError:string = null;
    let registerError:string = null;

    async function performLogin(e:UIEvent) {
        e.preventDefault();
        
        let t = e.target;
        let payload = {
            username: t[0].value,
            password: t[1].value
        }

        try {        
            isProgress = true;        
            let result = (await axios.post("/auth/login", payload)).data;

            if (result.status == "success") {
                login(result.token, result.user);
                replace("/dashboard");
            } else {
                loginError = result.error;
                isProgress = false;
            }
        } catch (error) {
            loginError = error.message;
            isProgress = false;   
        }

        setTimeout(() => loginError = null, 7000);

        return false;
    }

    async function performRegister(e:UIEvent) {
        e.preventDefault();

        let t = e.target;
    
        let payload = {
            code: t[0].value,
            fullname: t[1].value,
            phoneno: t[2].value,
            email: t[3].value,
            username: t[4].value,
            password: t[5].value,
            noLogin: true
        }

        try {        
            isProgress = true;        
            let result = (await axios.post("/auth/register", payload)).data;

            if (result.status == "success") {
                page = 0;
            } else {
                registerError = result.error;
            }
        } catch (error) {
            registerError = error.message;
        }
        isProgress = false;

        setTimeout(() => registerError = null, 7000);
        
        return false;
    }

    onMount(async () => {
        if (localStorage["loggedin"] && localStorage["loggedin"] == "true") {
            replace("/dashboard");
            return;
        }
        
        isDisplay = true;
    });
</script>

<div class="auth w-screen h-screen flex flex-col items-center justify-center">
    <div class="logo text-3xl mb-4" style="letter-spacing: 8px;">
        SORUS
    </div>
    
    {#if isDisplay}
        {#if page == 0}
            <div in:fade class="login panel p-4" style="width: 768px; max-width: 90vw; max-height: 80vh;">
                <h5 class="text-center gray-333">LOGIN</h5>
                <form class="mt-4" on:submit={performLogin}>
                    <TextField label="Username" disabled={isProgress}/>
                    <TextField label="Password" type="password"  disabled={isProgress}/>

                    {#if loginError}
                        <div class="error-msg text-center text-error-500 p-4" transition:slide>
                            {loginError}
                        </div>
                    {/if}

                    <Button type="submit" flat block disabled={isProgress}>Login</Button>
                    <Button type="button" color="secondary" flat block small text class="mt-4" on:click={() => page = 1} disabled={isProgress}>Register Instead</Button>
                </form>
            </div>
        {:else if page == 1}
            <div in:fade class="register panel p-4" style="width: 768px; max-width: 90vw; max-height: 80vh;">
                <h5 class="text-center gray-333">REGISTER</h5>
                <form class="mt-4" on:submit={performRegister}>
                    <TextField label="Registration Code" hint="Registration code that were given to you" />
                    <TextField label="Full Name" />
                    <TextField label="Contact Number" hint="i.e.: +60123456789" type="tel"/>
                    <TextField label="E-mail Address" type="email" />
                    <TextField label="Username"/>
                    <TextField label="Password" type="password" />

                    {#if registerError}
                        <div class="error-msg text-center text-error-500 p-4" transition:slide>
                            {registerError}
                        </div>
                    {/if}

                    <Button type="submit" flat block>Register</Button>
                    <Button type="button" color="secondary" flat block small text class="mt-4" on:click={() => page = 0}>Login Instead</Button>
                </form>
            </div>
        {/if}
    {/if}
</div>