const BallsArray = document.querySelectorAll(".ball");

let i = 0;

setInterval(() => {

    if (i > 2) i = 0;

    BallsArray[i].style.animationName = "balls";
    BallsArray[i].onAnimationEnd = () => { BallsArray[i].style.animationName = "a"; };
    i++;
}, 800);