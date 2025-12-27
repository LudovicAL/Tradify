/*
The tune index is a database in the form of a json object.
It contains the informations on availables tunes (their id, contour, abc, ...).
As to not overwhelm the server with repetitive pulls, it is cached on the client side
and updated only every 28 days (provided the client has internet access).
*/
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

/*
This function is the gateway to tune searching.
Provided with a contour string, it returns the best corresponding matches from the database.
*/
function startSearching(contourString) {
   console.log("Started: Tune index searching");
   let firstSearchResult = performFirstSearch(contourString);
   let secondSearchResult = performSecondSearch(contourString, firstSearchResult);
   console.log("Finished: Tune index searching");
   console.log("Result: " + secondSearchResult[0]);
}

/*
The first search in the database is fast, but inaccurate.
It is good for eliminating many poor candidates.
The algorithm it uses is called Aho-Corasick.
To use it, one must first slice the contour string into small blocks we'll call nGrams.
These nGrams are used to construct a new AhoCorasick object.
The AhoCorasick object having been constructed, it can be used to score every tune of the database.
The scored tunes are sorted, and then truncated so that only a subset of the best matches it kept.
*/
function performFirstSearch(contourString) {
   console.log("   Started: First search");
   //Slice the input into nGrams
   let nGramArray = [];
   for (let i = 0, max = (contourString.length - QUERY_NGRAM_SIZE_CONTOUR + 1); i < max; i++) {
      nGramArray.push(contourString.substring(i, i + QUERY_NGRAM_SIZE_CONTOUR));
   }
   //Execute the Aho-Corasick algorithm
   let rankedSettings = [];
   let ac = new AhoCorasick(nGramArray);
   Object.values(tuneIndex.settings).forEach(setting => {
      let score = ac.search(setting.contour);
      if (score > 0) {
         rankedSettings.push({ tune_id: setting.tune_id, score: score });
      }
   });
   //Sort and truncate the results
   rankedSettings.sort((a, b) => b.score - a.score);
   let slicedRankedSettings = rankedSettings.slice(0, FIRST_SEARCH_MAX_RESULTS);
   console.log("   Finished: First search");
   return slicedRankedSettings;
}

/*
The second search in the database is slow, but accurate.
The algorithm it uses is called Needleman-Wunsch.
*/
function performSecondSearch(contourString, firstSearchResult) {
   console.log("   Started: Second search");
   let rankedSettings = [];
   let contourStringLength = contourString.length;
   for (const searchResult of firstSearchResult) {
      //Apply the Needleman-Wunsch algorithm
      let a = null;
      let b = null;
      //Swap a and b such that b is always longer than a
      let searchResultSetting = tuneIndex.settings[parseInt(searchResult.tune_id)]
      if (contourStringLength > searchResultSetting.contour.length) {
         b = contourString;
         a = searchResultSetting.contour;
      } else {
         a = contourString;
         b = searchResultSetting.contour;
      }
      //Build a matrix organized as follow:
      //       a1 a2 a3 .. aN
      //    b1
      //    b2
      //    b3
      //    ..
      //    bN
      let lastRow = new Array(a.length + 1).fill(0);
      let lastColumnIndex = a.length;
      for (let row = 0, maxRow = b.length; row < maxRow; row++) {
         let previousDiagonal = 0;
         for (let col = 1, maxCol = lastRow.length; col < maxCol; col++) {
            let currentDiagonal = previousDiagonal;
            previousDiagonal = lastRow[col];
            lastRow[col] = Math.max(
                  currentDiagonal + ((a[col-1] === b[row]) ? MATCH_SCORE : MISMATCH_SCORE),
                  Math.max(
                     lastRow[col - 1] + GAP_SCORE, 
                     lastRow[col] + GAP_SCORE
                  )
               );
            lastRow[lastColumnIndex] = Math.max(lastRow[lastColumnIndex], previousDiagonal);
         }
      }
      let highscore = Math.max(...lastRow);
      let normalConstant = a.length;
      rankedSettings.push({ tune_id: searchResult.tune_id, score: result = 0.5 * highscore / normalConstant });
   }
   //Sort and truncate the results
   rankedSettings.sort((a, b) => b.score - a.score);
   let slicedRankedSettings = rankedSettings.slice(0, SECOND_SEARCH_MAX_RESULTS);
   console.log("   Finished: Second search");
   return slicedRankedSettings;
}