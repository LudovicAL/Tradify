var tuneIndex;

window.onload = async () => {
   console.log("Started: Tune index retrieval");
   tuneIndex = await window.idbKV.get('tuneIndex');
   if (navigator.onLine) {
      console.log('   Navigator online');
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
   } else {
      console.log('   Navigator offline. No action to take.');
   }
   console.log("Finished: Tune index retrieval");
};

function startSearching(contourStringArray) {
   console.log("Started: Tune index searching");
   
   
   console.log("Finished: Tune index searching");
}