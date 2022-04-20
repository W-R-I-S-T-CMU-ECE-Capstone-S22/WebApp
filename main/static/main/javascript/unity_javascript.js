// Define the data 
var data_chart = [{

}]; // Add data values to array

var ctx = document.getElementById("myChart").getContext('2d');

// End Defining data
var options = {
    responsive: false, // Instruct chart js to respond nicely.
    maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height 
    scales: {
      x: {
        suggestedMin: 0,
        suggestedMax: 50
      },
      y: {
        suggestedMin: 0,
        suggestedMax: 175
      }
    }
};

// End Defining data
var myChart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [{
                label: 'Finger Location', // Name the series
                data: data_chart, // Specify the data values array
          borderColor: '#2196f3', // Add custom color border            
          backgroundColor: '#2196f3', // Add custom color background (Points and Fill)
            }]
    },
    options: options
});

// MQTT protocol to receive data 
console.log('Setup...');

const MQTT_HOST = "mqtt.eclipseprojects.io/mqtt";
const MQTT_PORT = 9001;

// Create a client instance
client = new Paho.MQTT.Client(MQTT_HOST, MQTT_PORT, "webapp");

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({onSuccess:onConnect});


// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  client.subscribe("wrist/data/gestures");
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
    var chart_data = myChart.data.datasets[0].data
    // parsing data from the mqtt data and making appropriate calls to unity functions 
    if (payload.x_coord.length != 0) {
      // for visualization: 
      
      if (chart_data.length > 7){ 
        chart_data.shift()
      }
      chart_data.push({x:parseFloat(payload.y_coord[0]), y:parseFloat(payload.x_coord[0])});
      myChart.update();
      console.log(chart_data)
      var data = `gesture:${payload["gesture"]},x_coord:${payload.x_coord[0]},y_coord:${payload.y_coord[0]},timestamp:${payload.timestamp}`
      // console.log(data);
      if (payload.gesture == "two") {
        console.log("two called")
        var data = `gesture:pinch,x_coord:${payload.x_coord[0]},y_coord:${payload.y_coord[0]},timestamp:${payload.timestamp}`
        unity_rotate(data);
        
      } else if (payload.gesture == "swipe") {
        if (parseFloat(payload.x_coord[0]) > 0) {
          unity_rotate(data);
        } 
      }   
    } else {
      if (payload.gesture == "none") {
        chart_data = []
        myChart.update();
        var data = `gesture:${payload["gesture"]}`
        console.log("none");
        unity_rotate(data);
      }
    }   
}

/***** UNITY FUNCTIONS (communication calls to Unity functions from MQTT protocol data) ******/
function unity_rotate(data) {
  if (unity_instance != null) {
    unity_instance.SendMessage('chicken-rig', 'ProcessData', data);
  }
}

function unity_zoom_in() {
  if (unity_instance != null) {
    console.log("Unity zoom in called");
    unity_instance.SendMessage('chicken-rig', "ZoomInObject"); 
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

