var importedAudioSampleArray = null;

/**
 * Checks that the list of files submitted for import by the user contains exactly 1 element,
 * and that this element is a wav.
 *
 * @param {List<File>} files The list of file submitted for import by the user.
 * @return {Boolean} True if the submitted list is valid, false otherwise.
 */
function validateFile(files) {
   if (files.length > 1) {
      let errorMessage = getTranslation("tooManyImportedFiles", "Veuillez sélectionner un seul fichier.");
      alert(errorMessage);
      console.log(errorMessage);
      return false;
   } else if (files.length < 1) {
      console.log("No file selected");
      return false;
   } else if (files[0].type != "audio/wav") {
      let errorMessage = getTranslation("notAWav", "Veuillez sélectionner un fichier de type WAV.");
      alert(errorMessage);
      console.log(errorMessage);
      return false;
   }
   return true;
}

/**
 * Checks that the list of files submitted for import by the user contains exactly 1 element,
 * and that this element is a wav.
 *
 * @param {Function} onFinishedImporting The callback function to call when this method is finished executing.
 * @param {TuneSearch} tuneSearch An object containing the details of the current search.
 */
async function startImporting(onFinishedImporting, tuneSearch) {
   console.log("Started: Start Importing");
   importedAudioSampleArray = [];
   let rawSampleArray = [];
   const arrayBuffer = await tuneSearch.wavFile.arrayBuffer();
   const waveParser = new WaveParser(arrayBuffer);
   let dataLength = waveParser.samples[0].length + waveParser.samples[1].length;
   let numWindows = Math.floor(dataLength / WINDOW_SIZE);
   let lastIndice = numWindows * WINDOW_SIZE;
   for (let i = 0; i < numWindows; i++) {
      let windowArray = [];
      for (let j = (i * (WINDOW_SIZE / 2)), max = Math.min((dataLength / 2), (((i + 1) * WINDOW_SIZE) / 2)); j < max; j++) {
         windowArray.push(waveParser.samples[0][j]);
         windowArray.push(waveParser.samples[1][j]);
      }
      importedAudioSampleArray.push(windowArray);
   }
   tuneSearch.setAudioSampleArray(importedAudioSampleArray);
   tuneSearch.setSampleRate(waveParser.sampleRate);
   console.log("Finished: Start Importing");
   onFinishedImporting(tuneSearch);
}
