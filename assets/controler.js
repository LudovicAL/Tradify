var startImportingButton = document.getElementById("startImportingButton");
var startRecordingButton = document.getElementById("startRecordingButton");
var stopRecordingButton = document.getElementById("stopRecordingButton");

function onStartImportingButtonClick() {
   startImporting();
}

function onStartRecordingButtonClick() {
   startRecording();
}

function onStopRecordingButtonClick() {
   stopRecording();
}

startImportingButton.addEventListener("click", onStartImportingButtonClick);
startRecordingButton.addEventListener("click", onStartRecordingButtonClick);
stopRecordingButton.addEventListener("click", onStopRecordingButtonClick);

window.onload = async () => {
   console.log("Started: Tune index retrieval");
   let tuneIndex = await window.idbKV.get('tuneIndex');
   if (typeof tuneIndex === 'undefined') {
      console.log('   No tune index was cached, requesting download');
      tuneIndex = await fetch(TUNE_INDEX_URL).then((response) => response.json());
      await window.idbKV.set('tuneIndex', tuneIndex);
      await window.idbKV.set('tuneIndexDate', new Date());
   } else {
      console.log('   Found cached tune index');
      let tuneIndexDate = await window.idbKV.get('tuneIndexDate');
      if (tuneIndexDate === 'undefined' || ((Date.now() - tuneIndexDate) >= (28 * MILLISECONDS_PER_DAY))) {
         console.log('   Cached tune index date is undefined or too old. Tune index will be renewed.');
         tuneIndex = await fetch(TUNE_INDEX_URL).then((response) => response.json());
         await window.idbKV.set('tuneIndex', tuneIndex);
         await window.idbKV.set('tuneIndexDate', new Date());
      } else {
         console.log('   Cached tune index date is recent enough. No action to take.');
      }
   }
   console.log("Finished: Tune index retrieval");
};
