// Copyright (c) 2022 Jingle

document.getElementById("optsCloseMsg").style.animationName = "showMsgOptions";
setTimeout(() => { document.getElementById("optsCloseMsg").style.animationName = "hideMsgOptions" }, 2000);

async function dataFetch(str) {

    if (!str.includes("ftc(")) return "";

    let startIndex = await str.indexOf("ftc(");
    let endIndex = await str.lastIndexOf(")");

    let result = await str.substring(startIndex + 4, endIndex);

    if (!result) return "";

    await window.api.send("options_get_data", result);

    let data = null;

    await new Promise((resolve, reject) => {

        window.api.receive("options_get_data", (_event, d) => {
            data = d;
            resolve();
        });

        setTimeout(() => {
            data = "time out.";
            reject();
        }, 1200);
    });

    return data;
}

async function setData() {
    let info = [];
    let inputs = await document.querySelectorAll(".configInput");

    await inputs.forEach(i => {

        if (!i.id || !i.value) return;

        info.push({
            key: i.id,
            value: i.value
        });
    });

    let sucess = false;

    window.api.send("options_set_data", info);
    await new Promise((resolve, reject) => {

        window.api.receive("options_set_data", (_event, s) => {
            sucess = s;
            resolve();
        });

        setTimeout(reject, 1200);
    });

    if (sucess) alert("Salvo!");
    else alert("Não salvo!");
}

$(".opt").on("click", async (event) => {
    try {
        let list = await document.getElementById("options_frame");

        await $("#options_frame").empty();

        let options = await (await (await fetch("../../src/options_list.json")).json()).options;
        let option = await options.find(op => op.title == event.currentTarget.innerHTML);

        if (!option) return;

        let title = await list.appendChild(document.createElement("h2"));

        title.className = "title";
        title.innerText = option.title;

        let description = await list.appendChild(document.createElement("p"));

        description.className = "description";
        description.innerText = option.description;

        if (option.backup) {
            let backup = await list.appendChild(document.createElement("img"));

            backup.className = "cloudBackup";
            await backup.setAttribute("src", "");
        }

        let form = await list.appendChild(document.createElement("form"));

        option.list.forEach(async item => {
            let box = await form.appendChild(document.createElement("div"));

            let label = await box.appendChild(document.createElement("p"));
            let input = await box.appendChild(document.createElement("input"));

            label.innerHTML = item.label + ":";

            input.className = "configInput";

            for (let prop in item.input) {

                if (prop == "placeholder" && item.input[prop].includes("ftc("))
                    return input.setAttribute(prop, await dataFetch(item.input[prop]));

                input.setAttribute(prop, item.input[prop]);
            }
        });

        let save = await list.appendChild(document.createElement("button"));

        save.className = "save";
        save.innerHTML = "salvar";

        save.onclick = setData;
    }

    catch (err) {
        alert(err);
    }
});

$("#closeOptions").on("click", () => {
    $("#options").empty();
});