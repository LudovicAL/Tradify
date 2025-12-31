function getBlackmanWindow() {
   let a0 = 7938.0 / 18608.0;
   let a1 = 9240.0 / 18608.0;
   let a2 = 1430.0 / 18608.0;
   let blackmanWindow = new Array(WINDOW_SIZE);
   let size = (WINDOW_SIZE - 1);
   for (let i = 0; i < WINDOW_SIZE; i++) {
      blackmanWindow[i] = a0 - a1 * Math.cos(2.0 * Math.PI * i / size) + a2 * Math.cos(4.0 * Math.PI * i / size);
   }
   return blackmanWindow;
}

function drawArrayOfArraysOnCanvas(canvasName, arrayOfArrays, width, height) {
   let widthMagnification = 2;
   let heightMagnification = 2;
   //Prepare the canvas
   let canvasElement = document.getElementById(canvasName);
   const canvasContext = canvasElement.getContext("2d");
   canvasElement.width = (width * widthMagnification) + 1;
   canvasElement.height = (height * heightMagnification) + 1;
   //Clear the canvas
   canvasContext.fillStyle = "rgb(255, 255, 255)";
   canvasContext.fillRect(0, 0, canvasElement.width, canvasElement.height);
   //Draw on the canvas
   for (let i = 0; i < width; i++) {
      let max = Math.max(...arrayOfArrays[i]);
      for (let j = 0; j < height; j++) {
         let intensity = 255 - Math.floor(255 * arrayOfArrays[i][j] / max);
         canvasContext.fillStyle = "rgb(" + intensity + ", " + intensity + ", " + intensity + ")";
         canvasContext.fillRect(i * widthMagnification, canvasElement.height - (j * heightMagnification), widthMagnification, heightMagnification);
      }
   }
}

function drawArrayOnCanvas(canvasName, dataArray, widthMagnification) {
   let heightMagnification = 2;
   //Prepare the canvas
   let maxValue = Math.max(...dataArray);
   let canvasElement = document.getElementById(canvasName);
   const canvasContext = canvasElement.getContext("2d");
   let width = dataArray.length * widthMagnification + 1;
   let height = maxValue * heightMagnification + 1;
   canvasElement.width = width;
   canvasElement.height = height;
   //Clear the canvas
   canvasContext.fillStyle = "rgb(255, 255, 255)";
   canvasContext.fillRect(0, 0, width, height);
   //Draw on the canvas
   canvasContext.fillStyle = "rgb(0, 0, 0)";
   for (let i = 0, max = dataArray.length; i < max; i++) {
      canvasContext.fillRect(i * widthMagnification, height - dataArray[i] * heightMagnification, widthMagnification, heightMagnification);
   }
}

async function fetchJsonFile(url, storeName, storeLifeSpanInDays) {
   jsonFile = await window.idbKV.get(storeName);
   if (navigator.onLine) {
      console.log("   Navigator online");
      if (typeof jsonFile === 'undefined') {
         console.log("   No file named " + storeName + " was cached, requesting download");
         jsonFile = await fetch(url).then((response) => response.json());
         await window.idbKV.set(storeName, jsonFile);
         await window.idbKV.set(storeName + "Date", new Date());
      } else {
         console.log("   Found cached file named " + storeName);
         let fileCacheDate = await window.idbKV.get(storeName + "Date");
         if (typeof fileCacheDate === 'undefined' || ((Date.now() - fileCacheDate) >= (storeLifeSpanInDays * MILLISECONDS_PER_DAY))) {
            console.log("   Cached " + storeName + " date is undefined or too old. The file will be renewed.");
            jsonFile = await fetch(url).then((response) => response.json());
            await window.idbKV.set(storeName, jsonFile);
            await window.idbKV.set(storeName + "Date", new Date());
         } else {
            console.log("   Cached " + storeName + " date is recent enough. No action to take.");
         }
      }
   } else {
      console.log("   Navigator offline. No action to take.");
   }
   return jsonFile;
}