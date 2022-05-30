const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    send: (channel, data) => {
        let whiteListChannels = ["send_emojis", "send_talks", "get_messages", "send_message", "change_status", "options_get_data", "options_set_data", "update-available"];

        if (whiteListChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },

    receive: (channel, callback) => {
        let whiteListChannels = ["send_emojis", "send_profile", "send_talks", "get_messages", "send_message", "change_status", "options_get_data", "options_set_data", "update-available"];

        if (whiteListChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, data) => callback(event, data));
        }
    }
});