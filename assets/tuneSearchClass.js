class TuneSearch {
   constructor(recordingNumber, currentStatus) {
      this.recordingNumber = recordingNumber;
      this.currentStatus = currentStatus;
      this.recordedAudioSampleArray = [];
      this.sampleRate = 1;
      this.contourString = "";
      this.rankedTunes = [];
   }

   setRankedTunes(rankedTunes) {
      this.rankedTunes = rankedTunes;
   }
   
   setStatus(newStatus) {
      this.currentStatus = newStatus;
      return newStatus;
   }
   
   setAudioSampleArray(audioSampleArray) {
      this.audioSampleArray = audioSampleArray;
   }
   
   setSampleRate(sampleRate) {
      this.sampleRate = sampleRate;
   }
   
   setContourString(contourString) {
      this.contourString = contourString;
   }
}