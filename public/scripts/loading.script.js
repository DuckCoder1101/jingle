// Copyright (c) 2022 Jingle

const balls = $(".ball").toArray();
let i = 0;

setInterval(() => {

    if (i >= balls.length) i = 0;

    balls[i].animate(
        [
            { transform: "translateY(0px)" },
            { transform: "translateY(-30px)" },
            { transform: "translateY(0px)" }
        ],

        {
            duration: 550,
            iterations: 1,
            fill: "forwards",
            easing: "linear"
        }
    );

    i++;
}, 600);

window.api.receive("update-available", () => {
    $(".ball").remove();

    let message = document.body.appendChild(
        document.createElement("p")
    );

    message.innerHTML = "Uma nova atualização está sendo baixada, relaxe enquanto fazemos todo o trabalho."
    message.className = "message";
});