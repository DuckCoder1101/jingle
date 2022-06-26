// Copyright (c) 2022 Jingle

// Electron
const {
  app,
  BrowserWindow,
  autoUpdater,
  nativeImage,
  Notification,
  ipcMain
} = require("electron");

// Ohter packages
const emojis = require("unicode-emoji-json");
const isDev = require("electron-is-dev");
const { join } = require("path");

const { quit, get, set, create_tray, verify_data } = require("./modules");
const MessageModel = require("./models/message");

// Global vars
//const wait = time => new Promise(resolve => setTimeout(resolve, time));

var profile_data = get("profile");
var mainWindow = null;

// Starts the Jingle
async function createMainWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      opacity: 0,
      title: app.getName(),
      icon: exports.icon,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, "./preload.js"),
      },
    });

    await mainWindow.loadFile(join(__dirname, "../public/views/index.html"));
    mainWindow.webContents.send("send_profile", profile_data);
    mainWindow.webContents.send("send_emojis", emojis);

    await mainWindow.setOpacity(1);
    mainWindow.maximize();
    create_tray();

    exports.mainWindow = mainWindow;
  } catch (err) {
    quit(err);
  }

  mainWindow.on("system-context-menu", (event) => event.preventDefault());
  mainWindow.on("close", async (event) => {
    mainWindow.hide();
    event.preventDefault();

    if (profile_data.options.notify_when_close == false) {
      new Notification({
        title: app.getName(),
        body: "Jingle está sendo executado em segundo plano.",
        icon: exports.icon,
        timeoutType: "default",
        actions: [
          { type: "button", text: "Não exibir novamente." },
          { type: "button", text: "Ok" },
        ],
      }).show();
    }
  });

  setInterval(() => set("profile", profile_data), 1000 * 60 * 2.5);
  //setInterval(getMessages, 5000);
}

// App ready
app.on("ready", async () => {
  await app.setAppUserModelId(process.execPath);
  await app.setName("Jingle");
  await verify_data();

  process.title = await app.getName();

  // Loading Screen
  const loagingScreen = new BrowserWindow({
    width: 400,
    height: 300,
    title: app.getName(),
    autoHideMenuBar: true,
    frame: false,
    center: true,
    closable: false,
    opacity: 0,
    icon: exports.icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "./preload.js"),
    },
  });

  await loagingScreen.loadFile(join(__dirname, "../public/views/loading.html"));
  loagingScreen.setOpacity(1);

  if (!isDev) {
    await autoUpdater.setFeedURL({ url: exports.update_url });
    autoUpdater.checkForUpdates();
  } else {
    createMainWindow();
    loagingScreen.destroy();
  }
});

app.on("activate", () => {
  let Windows = BrowserWindow.getAllWindows();

  if (Windows.length == 0) app.emit("ready");
  else Windows[0].maximize();
});

// IPC Main

ipcMain.on("get_messages", (_event, id) => {
  let contact = profile_data.contacts.find((contact) => contact.id == id) || {};
  let messages = contact.messages;

  mainWindow.webContents.send("get_messages", messages);
});

ipcMain.on("send_message", (_event, message) => {
  let content = message.content;
  let contact = profile_data.contacts.find(
    (c) => c.id === message.contact_id && c.haveAnActiveTalk == true
  );

  if (contact && content.trim().length > 0)
    contact.messages.push(new MessageModel(message, profile_data, contact));
});

ipcMain.on("options_get_data", (_event, key) => {
  let data = profile_data[key] || profile_data.options[key];
  mainWindow.webContents.send("options_get_data", data);
});

ipcMain.on("options_set_data", (_event, data) => {
  data.forEach((opt) => {
    if (profile_data[opt.key]) profile_data[opt.key] = opt.value;
    else profile_data.options[opt.key] = opt.value;
  });

  try {
    set("profile", profile_data);
  } catch (err) {
    if (isDev) console.log(err);
    mainWindow.webContents.send("options_set_data", false);
  }

  mainWindow.webContents.send("options_set_data", true);
});

// Exports
exports.profile_data = profile_data;

exports.icon = nativeImage
  .createFromPath(join(__dirname, "../public/icon.png"))
  .resize({ width: 500, height: 500, quuality: "better" });

exports.update_url = `https://jingle-updater.vercel.app/update/${
  process.platform
}/${app.getVersion()}`;
