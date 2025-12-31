var startRecordingButton = document.getElementById("startRecordingButton");
var startRecordingImage = document.getElementById("startRecordingImage");
var currentStatus = Status.IDLE;
var recordingNumber = 0;


function onStartRecordingButtonClick() {
   if (currentStatus === Status.IDLE) {
      currentStatus = Status.RECORDING;
      startRecording(onFinishedRecording, recordingNumber, jitterButton);
   }
}

async function jitterButton() {
   if (currentStatus === Status.RECORDING) {
      startRecordingImage.src = "icons/Recording.svg";
      startRecordingButton.style.transform = `scale(${0.9 + 0.05 * Math.random()})`;
      window.requestAnimationFrame(jitterButton);
   } else {
      startRecordingImage.src = "icons/Idle.svg";
      startRecordingButton.style.transform = `scale(1)`;
   }
}

function onFinishedRecording(currentRecordingNumber) {
   if (currentStatus === Status.RECORDING && currentRecordingNumber === recordingNumber) {
      currentStatus = Status.PROCESSING;
      stopRecording(currentRecordingNumber).then(result => {
         if (currentStatus === Status.PROCESSING && result.recordingNumber === recordingNumber) {
            if (result.audioSampleArray.length < 10) {
               let errorMessage = getTranslation("insufficentDataForAnalysis", "Les données enregistrées sont insuffisantes pour poursuivre avec l'analyse.");
               alert(errorMessage);
               console.log(errorMessage);
               currentStatus = Status.DISPLAYING;
               startDisplaying(onFinishedDisplaying, { rankedTunes: [] });
            } else {
               startProcessing(onFinishedProcessing, result);
            }
         }
      });
   }
}

function onFinishedProcessing(processingResult) {
   if (currentStatus === Status.PROCESSING && processingResult.recordingNumber === recordingNumber) {
      if (processingResult.contourString.length < 5) {
         let errorMessage = getTranslation("insufficentDataForSearch", "Les données enregistrées sont insuffisantes pour poursuivre avec la recherche.");
         alert(errorMessage);
         console.log(errorMessage);
         currentStatus = Status.DISPLAYING;
         startDisplaying(onFinishedDisplaying, { rankedTunes: [] });
      } else {
         currentStatus = Status.SEARCHING;
         startSearching(onFinishedSearching, processingResult);
      }
   }
}

function onFinishedSearching(searchResult) {
   if (currentStatus === Status.SEARCHING && searchResult.recordingNumber === recordingNumber) {
      currentStatus = Status.DISPLAYING;
      startDisplaying(onFinishedDisplaying, searchResult);
   }
}

function onFinishedDisplaying(currentRecordingNumber) {
   if (currentStatus === Status.DISPLAYING && currentRecordingNumber === recordingNumber) {
      currentStatus = Status.IDLE;
   }
}

/*
function onRecordButtonClick() {
   const recordImage = document.getElementById("recordImage");
   recordImage.src = "icons/Recording1.svg";
   jitterButton();
}

async function jitterButton() {
   recordButton.style.transform = `scale(${0.9 + 0.05 * Math.random()})`;
   window.requestAnimationFrame(jitterButton);
}

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
*/

startRecordingButton.addEventListener("click", onStartRecordingButtonClick);

if (DEBUG_MODE) {
   document.getElementById("debugDiv").classList.remove('collapse');;
}