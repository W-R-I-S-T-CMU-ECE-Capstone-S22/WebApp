var active_model = 0; 


// MQTT protocol to receive data
console.log('Setup...');

const MQTT_HOST = "mqtt.eclipseprojects.io/mqtt";
const MQTT_PORT = 9001;

const DATA_TOPIC = "wrist/data/gestures";
const BATT_TOPIC = "wrist/batt/sensors";
const BATT_TOPIC_ASK = "wrist/batt/ask";

// Create a client instance
client = new Paho.Client(MQTT_HOST, MQTT_PORT, "webapp" + Math.floor(Math.random()*1000000).toString());

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
// client.connect({onSuccess:onConnect});
client.connect(
  {
      cleanSession : false, 
      onSuccess : onConnect, 
      onFailure : onConnectionLost, 
      reconnect : true,         // Enable automatic reconnect
  });

// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  client.subscribe(DATA_TOPIC);
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:"+responseObject.errorMessage);
  }
}

// called when a message arrives
function onMessageArrived(message) {

    var payload = message.payloadString;
    payload = JSON.parse(payload);
    // parsing data from the mqtt data and making appropriate calls to unity functions 
    console.log(payload)
    if (payload.x_coord.length != 0) {
      // for visualization:
      var data = `gesture:${payload["gesture"]},x_coord:${payload.x_coord[0]},y_coord:${payload.y_coord[0]},timestamp:${payload.timestamp}`
      // console.log(data);
      if (payload.gesture == "two" || payload.gesture == "swipe") {
        
        if (parseFloat(payload.x_coord[0]) > 0 && parseFloat(payload.y_coord[0]) > 0 && payload.gesture == "swipe") {
          send_data_to_unity(data);
        } else if (parseFloat(payload.x_coord[0]) > 0 && payload.gesture == "two") {
          send_data_to_unity(data);
        } 
      }
    } else {
      if (payload.gesture == "none") {
        // chart_data = []
        // myChart.update();
        var data = `gesture:${payload["gesture"]}`
        // console.log("none");
        send_data_to_unity(data);
      }
    }
}

/***** UNITY FUNCTIONS (communication calls to Unity functions from MQTT protocol data) ******/
function send_data_to_unity(data) {
  if (unity_instance != null) {
    var name_of_model = "chicken-rig"
    if (active_model == 0) {
      name_of_model = "molecule"
    } else if (active_model == 1) {
      name_of_model = "Car_house"
    } else if (active_model == 2) {
      name_of_model = "chicken-rig"
    }
    unity_instance.SendMessage(name_of_model, 'ProcessData', data);
  }
}

function ChangeModel() {
  if (unity_instance != null) {
    console.log("Changing model");
    unity_instance.SendMessage('ExampleModels', 'SwitchAvatar');
    active_model = (active_model + 1) % 3;
  }
}

/******* UNITY RENDER BUILD *******/
var container = document.querySelector("#unity-container");
var canvas = document.querySelector("#unity-canvas");
var loadingBar = document.querySelector("#unity-loading-bar");
var progressBarFull = document.querySelector("#unity-progress-bar-full");
var fullscreenButton = document.querySelector("#unity-fullscreen-button");
var warningBanner = document.querySelector("#unity-warning");
var unity_instance = null;
var rotate = 0;

window.addEventListener('mousemove', function(e) {
  if (rotate == 1) {
    console.log(e);
  }
});

// Shows a temporary message banner/ribbon for a few seconds, or
// a permanent error message on top of the canvas if type=='error'.
// If type=='warning', a yellow highlight color is used.
// Modify or remove this function to customize the visually presented
// way that non-critical warnings and error messages are presented to the
// user.
function unityShowBanner(msg, type) {
  function updateBannerVisibility() {
    warningBanner.style.display = warningBanner.children.length ? 'block' : 'none';
  }
  var div = document.createElement('div');
  div.innerHTML = msg;
  warningBanner.appendChild(div);
  if (type == 'error') div.style = 'background: red; padding: 10px;';
  else {
    if (type == 'warning') div.style = 'background: yellow; padding: 10px;';
    setTimeout(function() {
      warningBanner.removeChild(div);
      updateBannerVisibility();
    }, 5000);
  }
  updateBannerVisibility();
}

var buildUrl = "/static/main/Build";
var loaderUrl = buildUrl + "/build.loader.js";
var config = {
  dataUrl: buildUrl + "/build.data",
  frameworkUrl: buildUrl + "/build.framework.js",
  codeUrl: buildUrl + "/build.wasm",
  streamingAssetsUrl: "StreamingAssets",
  companyName: "DefaultCompany",
  productName: "My project",
  productVersion: "0.1",
  showBanner: unityShowBanner,
};

// By default Unity keeps WebGL canvas render target size matched with
// the DOM size of the canvas element (scaled by window.devicePixelRatio)
// Set this to false if you want to decouple this synchronization from
// happening inside the engine, and you would instead like to size up
// the canvas DOM size and WebGL render target sizes yourself.
// config.matchWebGLToCanvasSize = false;

if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
  container.className = "unity-mobile";
  // Avoid draining fillrate performance on mobile devices,
  // and default/override low DPI mode on mobile browsers.
  config.devicePixelRatio = 1;
  unityShowBanner('WebGL builds are not supported on mobile devices.');
} else {
  canvas.style.width = "960px";
  canvas.style.height = "600px";
}
loadingBar.style.display = "block";

var script = document.createElement("script");
script.src = loaderUrl;
script.onload = () => {
  createUnityInstance(canvas, config, (progress) => {
    progressBarFull.style.width = 100 * progress + "%";
  }).then((unityInstance) => {
    unity_instance = unityInstance;
    loadingBar.style.display = "none";
    fullscreenButton.onclick = () => {
      unityInstance.SetFullscreen(1);
    };
  }).catch((message) => {
    alert(message);
  });
};
document.body.appendChild(script);

