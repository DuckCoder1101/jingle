const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  //ipcMain,
  dialog,
  //Notification,
} = require("electron");

const storage = require("electron-json-storage");
//const isDev = require("electron-is-dev");
const Index = require("./index");
//const { join } = require("path");
//const axios = require("axios");

var menuTray = null;

const file_exports = {
  quit: async (error = null) => {
    let res = await file_exports.set("profile", Index.profile_data);
    console.log(error);

    if (!res && process.platform !== "darwin")
      BrowserWindow.getAllWindows()[0].removeAllListeners("close"),
        menuTray.destroy(),
        app.quit();
    else if (res) {
      let output = dialog.showMessageBoxSync(BrowserWindow.getAllWindows[0], {
        title: "Data Error",
        message:
          "Um erro ocorreu enquanto salvavamos o seu perfil, tente salvar novamente, ou saia e perca alguns dados.",
        type: "error",
        buttons: ["Tentar novamente", "Sair"],
      });

      if (output == "Tentar novamente") this.quit();
      else if (output == "Sair" && process.platform != "darwin")
        BrowserWindow.getAllWindows()[0].removeAllListeners("close"),
          menuTray.destroy(),
          app.quit();
    }
  },

  get: (key = null) => {
    if (!key) return new Error("No key specified.");

    let data = storage.getSync(key);
    return data;
  },

  set: async (key = null, data = null) => {
    if (!key || !data) return new Error("No key or value specified.");

    let error = null;

    await new Promise((resolve, reject) => {
      storage.set(key, data, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    return error;
  },

  new_account: () => {
    //
  },

  create_tray: () => {
    menuTray = new Tray(Index.icon);

    const selectStatus = (code) => {
      if (code == 1) {
        Index.profile_data.options.status = "online";

        BrowserWindow.getAllWindows()[0].webContents.send(
          "change_status",
          "online"
        );
      } else if (code == 2) {
        Index.profile_data.options.status = "nao_perturbe";

        BrowserWindow.getAllWindows()[0].webContents.send(
          "change_status",
          "nao_perturbe"
        );
      } else {
        Index.profile_data.options.status = "invisivel";

        BrowserWindow.getAllWindows()[0].webContents.send(
          "change_status",
          "invisivel"
        );
      }
    };

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Status",
        type: "submenu",
        id: "status",
        submenu: [
          {
            label: "Online",
            id: "status",
            type: "radio",
            checked:
              Index.profile_data.options.status == "online" ? true : false,
            click: () => selectStatus(1),
          },
          {
            label: "Invisível",
            id: "status",
            type: "radio",
            checked:
              Index.profile_data.options.status == "invisivel" ? true : false,
            click: () => () => selectStatus(2),
          },
          {
            label: "Não perturbe!",
            id: "status",
            checked:
              Index.profile_data.options.status == "nao_perturbe"
                ? true
                : false,
            type: "radio",
            click: () => () => selectStatus(3),
          },
        ],
      },
      {
        label: "Ver Conversas",
        type: "normal",
        click: () => BrowserWindow.getAllWindows()[0].maximize(),
      },
      {
        label: "Fechar",
        type: "normal",
        click: () => file_exports.quit(),
      },
    ]);

    menuTray.setToolTip(app.getName());
    menuTray.setContextMenu(contextMenu);
  },

  get_messages: async () => {
    //.
  },

  verify_data: async () => {
    try {
      let profile_data = file_exports.get("profile");
      let schema = ["username", "avatar", "id", "email", "contacts", "options"];

      let missingData = false;
      
      // for (let info of schema) {
      //   if (!profile_data || !profile_data[info]) {
      //     missingData = true;
      //     break;
      //   } else {
      //     continue;
      //   }
      // }

      if (missingData) {
        await file_exports.set("profile", {
          username: "DuckCoder",
          id: "1101",
          email: "crisfavaedu@gmail.com",
          avatar: "",
          contacts: [
            {
              username: "PessoaAleatoria05",
              haveAnActiveTalk: true,
              id: "05506",
              messages: [],
            },
          ],
          options: {
            notify_when_close: true,
            status: "online",
            statusText: "",
          },
          session: {
            new: "",
            old: "",
          },
        });
      }
    } catch (err) {
      file_exports.quit(err);
    }
  },
};

module.exports = file_exports;
