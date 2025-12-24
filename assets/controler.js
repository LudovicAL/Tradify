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
