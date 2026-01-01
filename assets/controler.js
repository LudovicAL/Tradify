var startRecordingButton = document.getElementById("startRecordingButton");
var startRecordingImage = document.getElementById("startRecordingImage");
var importWavButton = document.getElementById("importWavButton");
var hiddenFilePicker = document.getElementById("hiddenFilePicker");
var currentStatus = Status.IDLE;
var recordingNumber = 0;
var currentCogRotation = 0;

function onStartRecordingButtonClick() {
   if (currentStatus === Status.IDLE) {
      recordingNumber++;
      currentStatus = Status.RECORDING;
      const tuneSearch = new TuneSearch(recordingNumber, currentStatus, null);
      startRecording(onFinishedRecording, tuneSearch);
   } else if (currentStatus === Status.RECORDING) {
      currentStatus = Status.IDLE;
   }
}

function onFinishedRecording(tuneSearch) {
   if (currentStatus === Status.RECORDING && tuneSearch.recordingNumber === recordingNumber) {
      currentStatus = tuneSearch.setStatus(Status.PROCESSING);
      stopRecording(tuneSearch).then(result => {
         if (currentStatus === Status.PROCESSING && result.recordingNumber === recordingNumber) {
            if (result.audioSampleArray.length < 10) {
               let errorMessage = getTranslation("insufficentDataForAnalysis", "Les données enregistrées sont insuffisantes pour poursuivre avec l'analyse. Vous jouez peut-être votre musique trop doucement.");
               alert(errorMessage);
               console.log(errorMessage);
               currentStatus = tuneSearch.setStatus(Status.DISPLAYING);
               startDisplaying(onFinishedDisplaying, { rankedTunes: [] });
            } else {
               rotateCogs();
               startProcessing(onFinishedProcessing, result);
            }
         }
      });
   }
}

function onStartImporting(event) {
   if (currentStatus === Status.IDLE) {
      const files = event.target.files;
      if (validateFile(files)) {
         recordingNumber++;
         currentStatus = Status.IMPORTING;
         const tuneSearch = new TuneSearch(recordingNumber, currentStatus, files[0]);
         startImporting(onFinishedImporting, tuneSearch);
      }
   }
}

function onFinishedImporting(tuneSearch) {
   if (currentStatus === Status.IMPORTING && tuneSearch.recordingNumber === recordingNumber) {
      currentStatus = tuneSearch.setStatus(Status.PROCESSING);
      if (tuneSearch.audioSampleArray.length < 10) {
         let errorMessage = getTranslation("insufficentDataForAnalysis", "Les données enregistrées sont insuffisantes pour poursuivre avec l'analyse. Vous jouez peut-être votre musique trop doucement.");
         alert(errorMessage);
         console.log(errorMessage);
         currentStatus = tuneSearch.setStatus(Status.DISPLAYING);
         startDisplaying(onFinishedDisplaying, { rankedTunes: [] });
      } else {
         rotateCogs();
         startProcessing(onFinishedProcessing, tuneSearch);
      }
   }
}

function onFinishedProcessing(tuneSearch) {
   if (currentStatus === Status.PROCESSING && tuneSearch.recordingNumber === recordingNumber) {
      if (tuneSearch.contourString.length < 5) {
         let errorMessage = getTranslation("insufficentDataForSearch", "Les données enregistrées sont insuffisantes pour poursuivre avec la recherche. Vous jouez peut-être votre musique trop doucement.");
         alert(errorMessage);
         console.log(errorMessage);
         currentStatus = tuneSearch.setStatus(Status.DISPLAYING);
         startDisplaying(onFinishedDisplaying, { rankedTunes: [] });
      } else {
         currentStatus = tuneSearch.setStatus(Status.SEARCHING);
         startSearching(onFinishedSearching, tuneSearch);
      }
   }
}

function onFinishedSearching(tuneSearch) {
   if (currentStatus === Status.SEARCHING && tuneSearch.recordingNumber === recordingNumber) {
      currentStatus = tuneSearch.setStatus(Status.DISPLAYING);
      startDisplaying(onFinishedDisplaying, tuneSearch);
   }
}

function onFinishedDisplaying(tuneSearch) {
   if (currentStatus === Status.DISPLAYING && tuneSearch.recordingNumber === recordingNumber) {
      currentStatus = tuneSearch.setStatus(Status.IDLE);
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

function rotateCogs() {
   if (currentStatus === Status.PROCESSING || currentStatus === Status.SEARCHING || currentStatus === Status.DISPLAYING) {
      startRecordingButton.disabled = true;
      startRecordingImage.src = "icons/Cog.svg";
      currentCogRotation = (currentCogRotation + 1) % 360;
      startRecordingButton.style.transform = `rotate(${currentCogRotation}deg)`;
      window.requestAnimationFrame(rotateCogs);
   } else {
      startRecordingButton.disabled = false;
      startRecordingImage.src = "icons/Idle.svg";
      currentCogRotation = 0;
      startRecordingButton.style.transform = `rotate(${currentCogRotation}deg)`;
   }
}

startRecordingButton.addEventListener("click", onStartRecordingButtonClick);
importWavButton.onclick = function() {
   hiddenFilePicker.click();
};
hiddenFilePicker.addEventListener('change', (event) => {
   onStartImporting(event);
});

if (DEBUG_MODE) {
   document.getElementById("debugDiv").classList.remove("collapse");;
}
