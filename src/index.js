// Copyright (c) 2022 Jingle


// Modules and Libraries

const { app, BrowserWindow, autoUpdater, nativeImage, Notification, ipcMain } = require("electron");
const { quit, new_account, get, set, create_tray, get_messages } = require("./modules");

const emojis     = require("unicode-emoji-json");
const isDev      = require("electron-is-dev");
const { join }   = require("path");

var profile_data = get("profile");
var mainWindow = null;

// Other Functions

const wait = time => new Promise(resolve => setTimeout(resolve, time));

// Starts the Jingle
async function Main(callback) {
  try {

    if (!profile_data || Object.keys(profile_data).length == 0) return new_account();


    let activeTalks = await profile_data.contacts.filter(c => c.haveAnActiveTalk === true);

    // Main Window
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      opacity: 0,
      title: app.getName(),
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, "./preload.js")
      }
    });

    exports.mainWindow = mainWindow;

    await mainWindow.loadFile(join(__dirname, "../public/views/index.html"));
    await mainWindow.setIcon(exports.icon);
    await create_tray();

    // Web contents

    await mainWindow.webContents.send("send_profile", {
      id: profile_data.id,
      username: profile_data.username,
      avatar: profile_data.avatar,
      options: profile_data.options
    });

    await mainWindow.webContents.send("send_talks", activeTalks);
    await mainWindow.webContents.send("send_emojis", emojis);

    await mainWindow.setOpacity(1);
    mainWindow.maximize();

    // Successfully created the window
    await callback(null);

    // IPC Main

    ipcMain.on("send_message", (event_, message_info) => {

      if (!message_info.content || message_info.content.trim().length == 0) return;
      if (!message_info.contact_id || !message_info.time) return;

      let contact = profile_data.contacts.find(c => c.haveAnActiveTalk === true && c.id === message_info.contact_id);

      if (!contact) return;

      let Message = {
        content: message_info.content,
        contactId: contact.id,
        attachments: message_info.attachments || [],
        time: message_info.time,
        author: {
          username: profile_data.author,
          avatar: profile_data.avatar,
          id: profile_data.id
        }
      };

      contact.messages.push(Message);
    });


    ipcMain.on("get_messages", (_event, id) => {

      let contact = profile_data.contacts.find(contact => contact.id == id);
      let messages = contact.messages;

      mainWindow.webContents.send("get_messages", messages);
    });

    // Other events

    mainWindow.on("system-context-menu", (event) => {
      event.preventDefault();
    });

    mainWindow.on("close", async (event) => {

      await mainWindow.hide();
      await event.preventDefault();

      if (profile_data.options.notify_when_close == false) return;

      let notification = null;

      if (process.platform == "win32") {
        notification = new Notification({
          toastXml: `
            <toast launch="myapp:action=navigate&amp;contentId=351" activationType="protocol">
              <visual>
                <binding template="ToastGeneric">
                  <text hint-maxLines="1">${app.getName()}</text>
                  <text>O app está sendo executado em segundo plano.</text>
                  <image placement="appLogoOverride" src="${join(__dirname, "../public/Icon.png")}"/>
                </binding>
              </visual>
              <actions>
                <action
                  content="Não exibir novamente"
                  arguments=""
                  activationType="protocol"/>

                <action
                  content="Ok"
                  arguments=""
                  activationType="protocol"/>
              </actions>
            </toast>`
        });
      }

      else {
        notification = new Notification({
          title: app.getName(),
          body: "Jingle está sendo executado em segundo plano.",
          icon: exports.icon,
          timeoutType: "default",
          actions: [{ type: "button", text: "Não exibir novamente." }, { type: "button", text: "Ok" }]
        });
      }

      await notification.show();
      await wait(12000);
    
      if (notification) notification.close();
    });
    
    setInterval(() => set("profile", profile_data), 1000 * 60 * 2.5);
    setInterval(get_messages, 5000);
  }

  catch (err) {
    callback(err);
  }
}

// App ready
app.on("ready", async () => {
  try {

    // Set the app model ID and the app name
    await app.setAppUserModelId(process.execPath);
    await app.setName("Jingle");

    // Set the title of the process
    process.title = await app.getName();


    // Loading Screen
    const loagingScreen = new BrowserWindow({
      width: 490,
      height: 320, 
      title: app.getName(),
      autoHideMenuBar: true,
      frame: false, 
      center: true, 
      closable: false, 
      opacity: 0,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, "./preload.js")
      }
    });

    // Load file and set the opacity to 1
    await loagingScreen.loadFile(join(__dirname, "../public/views/loading.html"));
    loagingScreen.setOpacity(1);


    // Dev or not
    if (!isDev) {
      await autoUpdater.setFeedURL({ "url": "", "serverType": "default" });
      await autoUpdater.checkForUpdates();
    }

    else {

      await wait(5500);

      /*Main((err) => {

        if (err) return quit(err);

        loagingScreen.destroy();
      });*/
    }
  }

  catch (err) {
    quit(err);
  }
});

app.on("activate", () => {

  let Windows = BrowserWindow.getAllWindows();

  if (Windows.length == 0) {
    app.emit("ready");
  }

  else {
    Windows[0].maximize();
  }
});


// Updater


// Exports

exports.profile_data = profile_data;

exports.icon = nativeImage
  .createFromPath(join(__dirname, "../public/icon.png"))
  .resize({ width: 500, height: 500, quuality: "better" });
