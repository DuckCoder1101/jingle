

const { 
    app, 
    BrowserWindow, 
    Tray, Menu, 
    ipcMain,
    dialog,
    Notification } = require("electron");

const storage  = require("electron-json-storage");
const isDev    = require("electron-is-dev");
const Index    = require("./index");
const axios    = require("axios");
const { join } = require("path");

let menuTray = null;

const file_exports = {

    quit: (error = null) => {

        if (error && isDev) console.log(error.message);
        if (menuTray) menuTray.destroy();

        BrowserWindow.getAllWindows()[0].removeAllListeners("close");

        storage.set("profile", Index.profile_data, (err) => {

            if (err) {
                let result = dialog.showMessageBoxSync(BrowserWindow.getAllWindows[0], {
                    title: "Data Error",
                    message: "Um erro ocorreu enquanto salvavamos o seu perfil, tente salvar novamente, ou saia e perca alguns dados. As suas mensagens estão seguras.",
                    type: "error",
                    buttons: ["Tentar novamente", "Sair"]
                });

                if (result == "Tentar novamente") this.quit();
                else if (process.platform != "darwin") {
                    app.quit();
                } 
            }

            else if (process.platform != "darwin") {
                app.quit();
            }
        });
    },

    get: (key = null) => {

        if (!key) return new Error("No key specified.");

       /*storage.set("profile", {
            username: "DuckCoder1101",
            email: "duckcoder1101@gmail.com",
            avatar: "",
            id: "owner_0101",
            contacts: [
                {
                    username: "Random Contact",
                    id: "2245667",
                    haveAnActiveTalk: true,
                    messages: [
                        {
                            author: "DuckCoder1101",
                            contact: "Random Contact",
                            content: "Oi eae?",
                            time: "02/03/2022 às 13:40",
                            attachments: []
                        }
                    ]
                }
            ],
            options: {
                notify_when_close: false
            },
            session: {
                new: "",
                old: ""
            }
        });*/

        let data = storage.getSync(key);

        return data;
    },

    set: async (key = null, data = null) => {
        try {
            if (!key || !data) return new Error("No key or value specified.");
            await storage.set(key, data);
        }

        catch (err) {
            //...
        }
    },

    new_account: () => {      
        let window = new BrowserWindow({
            width: 800,
            height: 600,
            title: "Talk Center",
            fullscreen: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        window.loadFile(join(__dirname, "../public/views/account.html"));
        window.maximize();

        ipcMain.on("account_form", (_event, data) => {
            let { account, error } = axios.default.post("", data);

            if (error || !account) return this.shut_down(error);
            this.set("profile", account);
        });
    },

    create_tray: () => {
        menuTray = new Tray(join(__dirname, "../public/circle.png"));

        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Status', type: "submenu", id: "status", submenu:
                    [
                        {
                            label: "Online", id: "online", type: "radio", checked: Index.profile_data.options.status == "online" ? true : false, click: () => {
                                Index.profile_data.options.status = "online";

                                contextMenu.getMenuItemById("status").submenu.items.forEach(item => item.checked = false);
                                contextMenu.getMenuItemById("status").submenu.getMenuItemById("online").checked = true;

                                BrowserWindow.getAllWindows()[0].webContents.send("change_status", "online");
                            }
                        },
                        {
                            label: "Invisível", id: "invisivel", type: "radio", checked: Index.profile_data.options.status == "invisivel" ? true : false, click: () => {
                                Index.profile_data.options.status = "invisivel";

                                contextMenu.getMenuItemById("status").submenu.items.forEach(item => item.checked = false);
                                contextMenu.getMenuItemById("status").submenu.getMenuItemById("invisivel").checked = true;

                                BrowserWindow.getAllWindows()[0].webContents.send("change_status", "invisivel");
                            }
                        },
                        {
                            label: "Não perturbe!", id: "nao_perturbe", checked: Index.profile_data.options.status == "nao_perturbe" ? true : false, type: "radio", click: () => {
                                Index.profile_data.options.status = "nao_perturbe";

                                contextMenu.getMenuItemById("status").submenu.items.forEach(item => item.checked = false);
                                contextMenu.getMenuItemById("status").submenu.getMenuItemById("nao_perturbe").checked = true;
                                
                                BrowserWindow.getAllWindows()[0].webContents.send("change_status", "nao_perturbe");
                            }
                        }
                    ]
            },
            {
                label: 'Ver Conversas', type: "normal", click: () => {
                    BrowserWindow.getAllWindows()[0].maximize();
                }
            },
            {
                label: "Fechar", type: "normal", click: () => {
                    file_exports.quit()
                }
            }
        ]);

        menuTray.setToolTip(app.getName());
        menuTray.setContextMenu(contextMenu);
    },

    get_messages: async () => {
    
        try {
            let response = await axios.default.post("", {
                profile: {
                    username: Index.profile_data.username,
                    id: Index.profile_data.id
                },
                session: Index.profile_data.session.new
            });

            if (!response.data.talks || response.status != 200 || Object.keys(response.data.talks).length == 0) return;

            let messages_authors = [];

            for (let talk of Object.keys(response.data.talks)) {
                let talkData = Index.profile_data.contacts.find(c => c.id == talk.id);
    
                if (!talkData) continue;

                if (!talkData.haveAnActiveTalk) {
                    talkData.haveAnActiveTalk = true;
                    talkData.messages.push(talk.messages);
                    BrowserWindow.getAllWindows()[0].webContents.send("updateContacts");
                }

                else {
                    talkData.messages.push(talk.messages);
                }

                messages_authors.push(talkData.username);
            }

            let notification = new Notification({
                title: app.getName(),
                subtitle: "Você tem novas mensagens.",
                body: messages_authors.join(", "),
                icon: join(__dirname, "../public/Icon.png"),
                timeoutType: "default",
                urgency: "normal"
            });

            notification.show();

            setTimeout(() => {
                if (!notification) return;
                notification.close();
            }, 15000);
        }

        catch (err) {

            if (isDev) return console.log(err);

            let res = dialog.showMessageBoxSync(BrowserWindow.getAllWindows()[0], {
                title: "Erro de pesquisa!",
                message: "Um erro ocorreu enquanto buscavamos suas mensagens, entre em contacto com o suporte para saber mais.",
                buttons: ["Ok", "Reiniciar o app"],
                type: "error"
            });

            if (res == 1) {
                file_exports.quit();
                app.relaunch();
            }
        }
    },

    verify_data: async () => {

        let profile_data = file_exports.get("profile");
        let schema = [ "username", "id", "email", "avatar", "contacts", "options" ];

        for (let info of schema) {
        
            if (!profile_data[info]) {
                await file_exports.set("profile", {
                    username: "",
                    id: "",
                    email: "",
                    avatar: "",
                    contacts: [],
                    options: {
                        notify_when_close: true,
                        status: "online",
                        statusText: ""
                    },
                    session: {
                        new: "",
                        old: ""
                    }
                });

                file_exports.quit();
            }
        }
    },
};

module.exports = file_exports
