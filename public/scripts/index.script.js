// Copyright (c) 2022 TalkCenter

var profileinfo    = { username: null, avatar: null };
var isEmojiOpen    = false;
var messageOptions = null;
var messages       = null;
var messageInput   = null;
var profile        = null;
var emojis         = null;
var EmojiButton    = null;
var SendButton     = null;
var options        = null;
var activeTalk     = null;
var attachments    = [];
var talks          = [];


window.onload = () => {
    messageInput   = document.getElementById("InputMessage");
    EmojiButton    = document.getElementById("EmojiButton");
    messageOptions = document.getElementById("msgOptions");
    messages       = document.getElementById("messages");
    options        = document.getElementById("options");
    profile        = document.getElementById("profile");
    emojis         = document.getElementById("emojis");
    SendButton     = document.getElementById("send");

    messageInput.addEventListener("keyup", () => {

        if (messageInput.value != "Digite a sua mensagem" &&
            messageInput.value.length > 0) {
            SendButton.style.opacity = "1";
        }

        else {
            SendButton.style.opacity = ".4";
        }
    });

    SendButton.addEventListener("click", send_message);

    $("#closeOptions").on("click", () => {
        options.style.opacity = "0";
        setTimeout(() => { options.style.zIndex = "-5" }, 420);
    });


    $(document).on("keyup", (event) => {

        switch (event.key) {
            case "Enter":
                send_message();
                break;

            case "Escape":
                if (options.style.opacity == "0" || !options.style.opacity) {
                    options.style.opacity = "1";
                    options.style.zIndex = "10";

                    document.getElementById("optsCloseMsg").style.animationName = "showMsgOptions"
                    setTimeout(() => { document.getElementById("optsCloseMsg").style.animationName = "hideMsgOptions" }, 2500);
                }

                else {
                    options.style.opacity = "0";
                    setTimeout(() => { options.style.zIndex = "-5" }, 420);
                }

                break;
        }
    });

    window.api.receive("send_profile", (_event, data) => {
        profileinfo = data;

        if (!profileinfo.avatar || !profileinfo.avatar.length == 0) {
          document.getElementById("avatar").setAttribute("src", "../contacts.png");
        }

        else {
          document.getElementById("avatar").setAttribute("src", profileinfo.avatar);
        }

        switch (profileinfo.options.status) {
            case "online": 
                document.getElementById("publicStatus").style.backgroundColor = "green";
                break;
            
            case "invisivel":
                document.getElementById("publicStatus").style.backgroundColor = "rgb(190, 190, 190)";
                break;
            
            case "nao_perturbe":
                document.getElementById("publicStatus").style.backgroundColor = "rgb(50, 50, 50)";
                break;
        }     

        document.getElementById("username").innerHTML = profileinfo.username;
    });

    window.api.receive("send_talks", (_event, data) => {

        for (let contactInfo of data) {

            let talk = document.getElementById("talks")
                .appendChild(document.createElement("div"));

            talk.className = "talk";
            talk.onclick = selectTalk;
            talk.id = contactInfo.id;

            let contactName = talk.appendChild(document.createElement("a"));
            let lastMessage = talk.appendChild(document.createElement("p"));
            lastMessage.id = `${contactInfo.id}_lastMessage`;

            contactName.innerHTML = contactInfo.username;
            lastMessage.innerHTML = contactInfo.messages[contactInfo.messages.length - 1].content + " " + contactInfo.messages[contactInfo.messages.length - 1].time;
        }
    });

    window.api.receive("get_messages", (_event, data) => post_messages(data));
    
    window.api.receive("change_status", (_event, data) => {
        switch (data) {
            case "online":
                document.getElementById("publicStatus").style.backgroundColor = "green";
                break;

            case "invisivel":
                document.getElementById("publicStatus").style.backgroundColor = "rgb(190, 190, 190)";
                break;

            case "nao_perturbe":
                document.getElementById("publicStatus").style.backgroundColor = "rgb(50, 50, 50)";
                break;
        }

        profileinfo.options.status = data;
    });
};

const send_message = () => {

    if (!activeTalk || !messageInput.value || messageInput.value.trim().length == 0) return;

    let SendTime   = new Date();
    let NewMessage = messages.appendChild(document.createElement("div"));

    NewMessage.className = "message";

    let InfoArea       = NewMessage.appendChild(document.createElement("div"));
    InfoArea.className = "info";

    let content        = NewMessage.appendChild(document.createElement("p"));
    let author_photo   = InfoArea.appendChild(document.createElement("img"));
    let author_name    = InfoArea.appendChild(document.createElement("b"));
    let send_time      = InfoArea.appendChild(document.createElement("a"));


    if (profile.avatar && profile.avatar.length > 0) {
        author_photo.scr = profileinfo.avatar;
    }

    else {
        author_photo.src  = "../contacts.png";
    }

    author_photo.className = "author_photo";

    author_name.className = "author_name";
    author_name.innerHTML = profileinfo.username;

    send_time.className = "time";
    send_time.innerHTML = `${SendTime.getDate()}/${SendTime.getMonth()}/${SendTime.getFullYear()} às ${SendTime.getHours()}:${SendTime.getMinutes()}`;

    content.className = "content";
    content.innerHTML = messageInput.value;

    let Attachments = NewMessage.appendChild(document.createElement("div"));

    for (let attfile of attachments) {

        let att = Attachments.appendChild(document.createElement("img"));

        att.className = "attachment";
        att.src       = attfile;
        att.alt       = "file";
    }

    window.api.send("send_message", {
        content: messageInput.value,
        contact_id: activeTalk.id,
        time: `${SendTime.getDate()}/${SendTime.getMonth()}/${SendTime.getFullYear()} às ${SendTime.getHours()}:${SendTime.getMinutes()}`,
        attachments: attachments
    });

    document.getElementById(`${activeTalk.id}_lastMessage`).innerHTML = messageInput.value + ` ${SendTime.getDate()}/${SendTime.getMonth()}/${SendTime.getFullYear()} às ${SendTime.getHours()}:${SendTime.getMinutes()}`;

    messageInput.value = "";
    SendButton.style.opacity = ".4";
};

const post_messages = (messages_array) => {

    for (let msg of messages_array) {

        let NewMessage = messages.appendChild(document.createElement("div"));
        NewMessage.className = "message";

        let InfoArea       = NewMessage.appendChild(document.createElement("div"));
        InfoArea.className = "info";

        let content        = NewMessage.appendChild(document.createElement("p"));
        let author_photo   = InfoArea.appendChild(document.createElement("img"));
        let author_name    = InfoArea.appendChild(document.createElement("b"));
        let send_time      = InfoArea.appendChild(document.createElement("a"));


        if (profile.avatar && profile.avatar.length > 0) {
            author_photo.scr = profileinfo.avatar;
        }

        else {
            author_photo.src = "../contacts.png";
        }

        author_photo.className = "author_photo";

        author_name.className = "author_name";
        author_name.innerHTML = profileinfo.username;

        send_time.className = "time";
        send_time.innerHTML = msg.time;

        content.className = "content";
        content.innerHTML = msg.content;

        let Attachments = NewMessage.appendChild(document.createElement("div"));

        for (let attfile of msg.attachments) {
            let att = Attachments.appendChild(document.createElement("img"));

            att.className = "attachment";
            att.src       = attfile;
            att.alt       = "file";
        }
    }

    $(".message").on("click", (event) => {
        if (event.button == 2) {

            messageOptions.style.top = event.clientY + "px";
            messageOptions.style.left = event.clientX + "px";

            messageOptions.style.opacity = "1";
            messageOptions.style.zIndex = "10";

            messageOptions.onmouseleave = () => {
                messageOptions.style.opacity = "0";
                messageOptions.style.zIndex = "-5";
            };
        }
    });
};

const selectTalk = (event) => {

    let target = event.currentTarget;

    if (!target) return;

    if (!activeTalk) {
        activeTalk = target;

        messageInput.parentNode.style.opacity = "1";
        messageInput.readOnly = false;
        messageInput.setAttribute("placeholder", "Digite a sua mensagem");

        window.api.send("get_messages", target.id);
    }

    else if (activeTalk && activeTalk.id === target.id) {
        activeTalk = null;

        messageInput.parentNode.style.opacity = ".4";
        messageInput.readOnly = true;
        messageInput.setAttribute("placeholder", "Selecione o crie uma conversa");

        for (let msg of document.querySelectorAll("div.message")) {
            msg.remove();
        }
    }

    else {
        activeTalk = target;

        for (let msg of document.querySelectorAll("div.message")) {
            msg.remove();
        }

        window.api.send("get_messages", target.id);
    }
};

window.api.receive("send_emojis", (_event, data) => {

    const GetRandomEmoji = () => {
        let randomEmoji = Object.keys(data)[
            Math.floor(Math.random() * Object.keys(data).length)];

        if (randomEmoji.length > 2) return GetRandomEmoji();
        return randomEmoji;
    };

    EmojiButton.innerHTML = GetRandomEmoji();

    EmojiButton.onclick = () => {

        if (!isEmojiOpen) {
            emojis.style.animationName = "showEmojis";
            isEmojiOpen = true;
        }

        else {
            emojis.style.animationName = "hideEmojis";
            isEmojiOpen = false;
        }
    }

    EmojiButton.onmouseover = () => {
        EmojiButton.innerHTML = GetRandomEmoji();
    };

    for (let emoji_data of Object.keys(data)) {

        if (emoji_data.length > 2 || emoji_data.includes("🫵")) continue;

        let emoji = emojis.appendChild(document.createElement("a"));

        emoji.className = "emoji";
        emoji.innerHTML = emoji_data;
    }

    $(".emoji").on("click", (event) => {
        messageInput.value += event.currentTarget.innerHTML;
        SendButton.style.opacity = "1";
    });
});