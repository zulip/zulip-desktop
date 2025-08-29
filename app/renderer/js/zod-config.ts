import * as z from "zod";

// In an Electron preload script, Content-Security-Policy only takes effect
// after the page has loaded, which breaks Zod's detection of whether eval is
// allowed.
z.config({jitless: true});
