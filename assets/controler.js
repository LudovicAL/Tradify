/**
 * The expected chain of events is as follow:
 *    1- The user clicks the 'Record' or 'Import' button.
 *    2- The onStartRecordingButtonClick() or onStartImportingButtonClick() function is triggered.
 *       The currentStatus variable changes from IDLE to RECORDING or IMPORTING.
 *    3- The onFinishedRecording() or onFinishedImporting() callback function is triggered.
 *       The currentStatus variable changes from RECORDING or IMPORTING to PROCESSING.
 *    4- The onFinishedProcessing() callback function is triggered.
 *       The currentStatus variable changes from PROCESSING to SEARCHING.
 *    5- The onFinishedSearching() callback function is triggered.
 *       The currentStatus variable changes from SEARCHING to DISPLAYING.
 *    6- The onFinishedDisplaying() callback function is triggered.
 *       The currentStatus variable changes from DISPLAYING to IDLE.
 */

var startRecordingButton = document.getElementById("startRecordingButton");
var startRecordingImage = document.getElementById("startRecordingImage");
var importWavButton = document.getElementById("importWavButton");
var hiddenFilePicker = document.getElementById("hiddenFilePicker");
var currentStatus = Status.IDLE;
var recordingNumber = 0;
var currentCogRotation = 0;

/**
 * Starts a new recording of the ambient audio.
 * This method is triggered by the user when he clicks the 'Record' button.
 */
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

/**
 * Callback function, called after a recording has been started.
 *
 * @param {TuneSearch} tuneSearch An object containing the details of the current search.
 */
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
               rotateCog();
               startProcessing(onFinishedProcessing, result);
            }
         }
      });
   }
}

/**
 * Starts the import of a wav file.
 * This method is triggered by the user when he clicks the 'Import' button.
 *
 * @param {Event} event An Event object containing the file selected by the user for analysis.
 */
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

/**
 * Callback function, called after a wav file has been imported.
 *
 * @param {TuneSearch} tuneSearch An object containing the details of the current search.
 */
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
         rotateCog();
         startProcessing(onFinishedProcessing, tuneSearch);
      }
   }
}

/**
 * Callback function, called after the recorded or imported audio has been processed.
 *
 * @param {TuneSearch} tuneSearch An object containing the details of the current search.
 */
function onFinishedProcessing(tuneSearch) {
   if (currentStatus === Status.PROCESSING && tuneSearch.recordingNumber === recordingNumber) {
      if (tuneSearch.contourString.length < 5) {
         let errorMessage = getTranslation("insufficentDataForSearch", "Les données enregistrées sont insuffisantes pour poursuivre avec la recherche. Vous jouez peut-être votre musique trop doucement.");
         alert(errorMessage);
         console.log(errorMessage);
         currentStatus = tuneSearch.setStatus(Status.DISPLAYING);
         startDisplaying(onFinishedDisplaying, tuneSearch);
      } else {
         currentStatus = tuneSearch.setStatus(Status.SEARCHING);
         startSearching(onFinishedSearching, tuneSearch);
      }
   }
}

/**
 * Callback function, called after a search has finished to find correspondances in the tune index.
 *
 * @param {TuneSearch} tuneSearch An object containing the details of the current search.
 */
function onFinishedSearching(tuneSearch) {
   if (currentStatus === Status.SEARCHING && tuneSearch.recordingNumber === recordingNumber) {
      currentStatus = tuneSearch.setStatus(Status.DISPLAYING);
      startDisplaying(onFinishedDisplaying, tuneSearch);
   }
}

/**
 * Callback function, called after the result of a search has been displayed on the screen for the user.
 *
 * @param {TuneSearch} tuneSearch An object containing the details of the current search.
 */
function onFinishedDisplaying(tuneSearch) {
   if (currentStatus === Status.DISPLAYING && tuneSearch.recordingNumber === recordingNumber) {
      currentStatus = tuneSearch.setStatus(Status.IDLE);
   }
}

/**
 * Jitters the 'Record' button as long as the current status is 'RECORDING'.
 * This is meant as to give the user some feedback, indicating the app is performing a task.
 */
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

/**
 * Animates a cog in a circling manner as long as the current status is 'PROCESSING', 'SEARCHING' or 'DISPLAYING'.
 * This is meant as to give the user some feedback, indicating the app is performing a task.
 */
function rotateCog() {
   if (currentStatus === Status.PROCESSING || currentStatus === Status.SEARCHING || currentStatus === Status.DISPLAYING) {
      startRecordingImage.src = "icons/Cog.svg";
      currentCogRotation = (currentCogRotation + 1) % 360;
      startRecordingButton.style.transform = `rotate(${currentCogRotation}deg)`;
      window.requestAnimationFrame(rotateCog);
   } else {
      startRecordingImage.src = "icons/Idle.svg";
      currentCogRotation = 0;
      startRecordingButton.style.transform = `rotate(${currentCogRotation}deg)`;
   }
}

startRecordingButton.addEventListener("click", onStartRecordingButtonClick);
importWavButton.onclick = function() {
   hiddenFilePicker.click();
};
hiddenFilePicker.addEventListener('change', (changeEvent) => {
   onStartImporting(changeEvent);
});
if (DEBUG_MODE) {
   document.getElementById("debugDiv").classList.remove("collapse");;
}
