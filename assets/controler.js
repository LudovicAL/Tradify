var startSearchingButton = document.getElementById("startSearchingButton");
var startImportingButton = document.getElementById("startImportingButton");
var startRecordingButton = document.getElementById("startRecordingButton");
var stopRecordingButton = document.getElementById("stopRecordingButton");

function onStartSearchingButtonClick() {
   startSearching("UqURURsqqooqKRqqqqqUURNoqqqssqqooqqsKlllljRRRRssssRUqRRoqUqqqqsRRRURoljRURlUPRUU");
}

function onStartImportingButtonClick() {
   startImporting();
}

function onStartRecordingButtonClick() {
   startRecording();
}

function onStopRecordingButtonClick() {
   stopRecording();
}

startSearchingButton.addEventListener("click", onStartSearchingButtonClick);
startImportingButton.addEventListener("click", onStartImportingButtonClick);
startRecordingButton.addEventListener("click", onStartRecordingButtonClick);
stopRecordingButton.addEventListener("click", onStopRecordingButtonClick);
