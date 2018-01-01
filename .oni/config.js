// For more information on customizing Oni,
// check out our wiki page:
// https://github.com/onivim/oni/wiki/Configuration

const activate = (oni) => {
    console.log("config activated")

    // Input 
    //
    // Add input bindings here:
    //
    oni.input.bind("<c-enter>", () => console.log("Control+Enter was pressed"))

    //
    // Or remove the default bindings here by uncommenting the below line:
    //
    // oni.input.unbind("<c-p>")
}

const deactivate = () => {
    console.log("config deactivated")
}

module.exports = {
    activate,
    deactivate,

   "language.vue.languageServer.command":"vls",

   "ui.colorscheme": "onedark",

   //"oni.useDefaultConfig": true,
   //"oni.bookmarks": ["~/Documents",]
   "oni.loadInitVim": true,
   "editor.fontSize": "16px",
   "editor.fontFamily": "IBM Plex Mono",

   // UI customizations
    "ui.animations.enabled": true,
    "ui.fontSmoothing": "auto",
}

