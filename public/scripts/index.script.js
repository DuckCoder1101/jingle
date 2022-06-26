// Copyright (c) 2022 Jingle

// Elements
var messageInput = null;
var statusColor = null;
var EmojiButton = null;
var messageOptions = null;
var messages = null;
var profile = null;
var emojis = null;
var avatar = null;
var SendButton = null;

// Global vars
var profileinfo = null;
var isEmojiOpen = false;
var activeTalk = null;
var attachments = [];

const GetRandomEmoji = data => {
  let randomEmoji =
    Object.keys(data)[Math.floor(Math.random() * Object.keys(data).length)];

  if (randomEmoji.length > 2) return GetRandomEmoji(data);
  return randomEmoji;
};

window.onload = () => {
  messageInput = document.getElementById("InputMessage");
  statusColor = document.getElementById("publicStatus");
  EmojiButton = document.getElementById("EmojiButton");
  messageOptions = document.getElementById("msgOptions");
  messages = document.getElementById("messages");
  profile = document.getElementById("profile");
  emojis = document.getElementById("emojis");
  avatar = document.getElementById("avatar");
  SendButton = document.getElementById("send");

  messageInput.addEventListener("keyup", event => {
    let content = event.currentTarget.value.trim() || "";

    if (content.length > 0) SendButton.style.opacity = "1";
    else SendButton.style.opacity = ".4";
  });

  $(document).on("keyup", (event) => {
    switch (event.key) {
      case "Enter":
        send_message();
        break;

      case "Escape":
        if (!document.getElementById("options_frame"))
          $("#options").load("../views/options.html");
        else $("#options").empty();

        break;
    }
  });

  window.api.receive("send_profile", (_event, data) => {
    profileinfo = data;

    // Profile
    if (!profileinfo.avatar || !profileinfo.avatar.length == 0)
      avatar.setAttribute("src", "../contacts.png");
    else avatar.setAttribute("src", profileinfo.avatar);

    document.getElementById("username").innerHTML = profileinfo.username;

    if (profileinfo.options.status == "online")
      statusColor.style.backgroundColor = "green";
    else if (profileinfo.options.status == "nao_perturbe")
      statusColor.style.backgroundColor = "rgb(50, 50, 50)";
    else statusColor.style.backgroundColor = "rgb(190, 190, 190)";

    // Talks

    let filteredTalks = data.contacts.filter((c) => c.haveAnActiveTalk == true);

    filteredTalks.forEach((info) => {
      let talk = document
        .getElementById("talks")
        .appendChild(document.createElement("div"));

      talk.className = "talk";
      talk.onclick = selectTalk;
      talk.id = info.id;

      let contactName = talk.appendChild(document.createElement("h3"));

      let lastMessage = talk.appendChild(document.createElement("p"));

      lastMessage.id = `${info.id}_lastMessage`;

      contactName.innerHTML = info.username;
      lastMessage.innerHTML =
        info.messages[info.messages.length - 1].content +
        " " +
        info.messages[info.messages.length - 1].time;
    });
  });

  window.api.receive("change_status", (_event, data) => {
    profileinfo.options.status = data;

    if (data == "online") statusColor.style.backgroundColor = "green";
    else if (data == "nao_perturbe")
      statusColor.style.backgroundColor = "rgb(50, 50, 50)";
    else statusColor.style.backgroundColor = "rgb(190, 190, 190)";
  });

  SendButton.addEventListener("click", send_message);
  window.api.receive("get_messages", (_event, data) => post_messages(data));

  window.api.receive("send_emojis", (_event, data) => {
    EmojiButton.innerHTML = GetRandomEmoji(data);

    EmojiButton.onmouseover = () => {
      EmojiButton.innerHTML = GetRandomEmoji(data);
    };

    for (let emoji_data of Object.keys(data)) {
      if (emoji_data.length > 2 || emoji_data.includes("🫵")) continue;

      let emoji = emojis.appendChild(document.createElement("h5"));

      emoji.className = "emoji";
      emoji.innerHTML = emoji_data;
    }

    $(".emoji").on("click", event => {
      messageInput.value += event.currentTarget.innerHTML;
      SendButton.style.opacity = "1";
    });
  });

  EmojiButton.onclick = () => {
    if (!isEmojiOpen) {
      emojis.style.animationName = "showEmojis";
      isEmojiOpen = true;
    } else {
      emojis.style.animationName = "hideEmojis";
      isEmojiOpen = false;
    }
  };
};

const send_message = () => {
  if (
    !activeTalk ||
    !messageInput.value ||
    messageInput.value.trim().length == 0
  )
    return;

  let SendTime = new Date();
  let NewMessage = messages.appendChild(document.createElement("div"));

  NewMessage.className = "message";

  let InfoArea = NewMessage.appendChild(document.createElement("div"));
  InfoArea.className = "info";

  let content = NewMessage.appendChild(document.createElement("p"));
  let author_photo = InfoArea.appendChild(document.createElement("img"));
  let author_name = InfoArea.appendChild(document.createElement("b"));
  let send_time = InfoArea.appendChild(document.createElement("a"));

  if (profile.avatar && profile.avatar.length > 0) {
    author_photo.scr = profileinfo.avatar;
  } else {
    author_photo.src = "../contacts.png";
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
    att.src = attfile;
    att.alt = "file";
  }

  window.api.send("send_message", {
    content: messageInput.value,
    contact_id: activeTalk.id,
    time: `${SendTime.getDate()}/${SendTime.getMonth()}/${SendTime.getFullYear()} às ${SendTime.getHours()}:${SendTime.getMinutes()}`,
    attachments: attachments,
  });

  document.getElementById(`${activeTalk.id}_lastMessage`).innerHTML =
    messageInput.value +
    ` ${SendTime.getDate()}/${SendTime.getMonth()}/${SendTime.getFullYear()} às ${SendTime.getHours()}:${SendTime.getMinutes()}`;

  messageInput.value = "";
  SendButton.style.opacity = ".4";
};

const post_messages = (messages_array) => {
  for (let msg of messages_array) {
    let NewMessage = messages.appendChild(document.createElement("div"));
    NewMessage.className = "message";

    let InfoArea = NewMessage.appendChild(document.createElement("div"));
    InfoArea.className = "info";

    let content = NewMessage.appendChild(document.createElement("p"));
    let author_photo = InfoArea.appendChild(document.createElement("img"));
    let author_name = InfoArea.appendChild(document.createElement("b"));
    let send_time = InfoArea.appendChild(document.createElement("a"));

    if (profile.avatar && profile.avatar.length > 0) {
      author_photo.scr = profileinfo.avatar;
    } else {
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
      att.src = attfile;
      att.alt = "file";
    }
  }

  $(".message").on("mousedown", (event) => {
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

const selectTalk = event => {
  let target = event.currentTarget;

  if (!activeTalk) {
    alert("a");
    activeTalk = target;

    messageInput.parentNode.style.opacity = "1";
    messageInput.readOnly = false;
    messageInput.setAttribute("placeholder", "Digite a sua mensagem");

    window.api.send("get_messages", target.id);
  } else if (activeTalk && activeTalk.id === target.id) {
    alert("b");
    activeTalk = null;

    messageInput.parentNode.style.opacity = ".4";
    messageInput.readOnly = true;
    messageInput.setAttribute("placeholder", "Selecione o crie uma conversa");

    for (let msg of document.querySelectorAll("div.message")) {
      msg.remove();
    }
  } else {
    alert("c")
    activeTalk = target;

    for (let msg of document.querySelectorAll("div.message")) {
      msg.remove();
    }

    window.api.send("get_messages", target.id);
  }
};

$("#typesSelectorButton").on("mouseover", () => {
  document.getElementById("typesSelector").style.opacity = 1;
  document.getElementById("typesSelector").style.zIndex = 5;
});

$("#typesSelector").on("mouseleave", () => {
  document.getElementById("typesSelector").style.opacity = 0;
  document.getElementById("typesSelector").style.zIndex = -5;
});

$("#contacts").on("mouseleave", (event) => {
  setTimeout(() => {
    if (!$("#contacts").is(":hover"))
      event.currentTarget.style.transform = "translateY(0%)";
  }, 400);
});

$("#contactsbutton").on("click", () => {
  document.getElementById("contacts").style.transform = "translateY(100%)";

  setTimeout(() => {
    if (!$("#contacts").is(":hover"))
      document.getElementById("contacts").style.transform = "translateY(0%)";
  }, 2100);
});
