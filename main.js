let score = 0;

let enterVRBtn = document.querySelector("#myEnterVRButton");
enterVRBtn.addEventListener("click", () => {
  var audioCity = new Audio("assets/sounds/citySounds.mp3");
  audioCity.play();
  audioCity.loop = true;
  audioCity.volume = 0.2;
});

let showControls = document.querySelector("#controlsBtn");
showControls.addEventListener("click", () => {
  let controls = document.getElementById("controls");
  if (controls.style.display == "none") {
    controls.style.display = "inline-block";
    let showControlsText = document.getElementById("showControlsText");
    showControlsText.innerHTML = "Hide controls";
  } else {
    controls.style.display = "none";
    showControlsText.innerHTML = "Show controls";
  }
});

if (localStorage.getItem("score") !== null) {
  document
    .querySelector("#highScoreText")
    .setAttribute(
      "text",
      "width: 20; color: white; font: https://raw.githubusercontent.com/etiennepinchon/aframe-fonts/master/fonts/orbitron/Orbitron-Black.json ; shader: msdf; value: " +
        localStorage.getItem("score")
    );
  document.querySelector("#highScoreTextTitle").innerHTML =
    localStorage.getItem("score");
}

var playerEl = document.querySelector("#score");
var canListen = true; // a variable to store the state of the event listener
playerEl.addEventListener("collide", function (e) {
  if (canListen) {
    console.log(e.detail.body.id);
    // check if the event listener can listen
    if (e.detail.body.id == 13) {
      score++;
      document
        .querySelector("#scoreText")
        .setAttribute(
          "text",
          "width: 20; color: white; font: https://raw.githubusercontent.com/etiennepinchon/aframe-fonts/master/fonts/orbitron/Orbitron-Black.json ; shader: msdf;value: " +
            score
        );
      document
        .querySelector("#scoreTextBasket")
        .setAttribute("text", "width: 6; color: red; value: " + score);

      if (score > localStorage.getItem("score")) {
        document
          .querySelector("#highScoreText")
          .setAttribute(
            "text",
            "width: 20; color: white; font: https://raw.githubusercontent.com/etiennepinchon/aframe-fonts/master/fonts/orbitron/Orbitron-Black.json ; shader: msdf;value:" +
              score
          );
        localStorage.setItem("score", score);
      }

      console.log(score);
    }
    canListen = false; // set the state to false
    setTimeout(function () {
      // use a setTimeout function to reset the state after one second
      canListen = true;
    }, 1000);
  }
});
var ground = document.querySelector("#ground");
var lastCollisionTime = 0;
var collisionCount = 0;
var resetTimeout;
ground.addEventListener("collide", function (e) {
  var now = Date.now();
  if (e.detail.body.id == 11 && now - lastCollisionTime > 200) {
    // console.log("hit the ground");
    lastCollisionTime = now;
    collisionCount = 0;
    clearTimeout(resetTimeout);
    resetTimeout = setTimeout(function () {
      collisionCount = 0;
    }, 1000); // Reset after 1 second
  }
  if (collisionCount < 1) {
    var audio = new Audio(
      "assets/sounds/mixkit-ball-bouncing-in-the-ground-2077.wav"
    );
    audio.play();
    collisionCount++;
  } else {
  }
});
var ball = document.querySelector("#ball");
var canListen2 = true;
ball.addEventListener("collide", function (e) {
  if (canListen2) {
    // check if the event listener can listen
    if (
      e.detail.body.id == 12 ||
      e.detail.body.id == 13 ||
      e.detail.body.id == 14 ||
      e.detail.body.id == 16
    ) {
      var audio = new Audio(
        "assets/sounds/mixkit-basketball-ball-hitting-the-net-2084.wav"
      );
      audio.play();
      // Do something when the ball hits the basket, e.g. increase score
    }
    canListen2 = false; // set the state to false
    setTimeout(function () {
      // use a setTimeout function to reset the state after one second
      canListen2 = true;
    }, 1000);
  }
});
AFRAME.registerComponent("reset-button", {
  init: function () {
    const el = this.el; // Reference to the element this component is attached to

    el.addEventListener("xbuttondown", () => {
      location.reload();
    });
  },
});
