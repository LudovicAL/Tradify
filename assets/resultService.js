var resultTable = document.getElementById("resultTable");

/**
 * Displays on the screen the result of a search.
 *
 * @param {Function} onFinishedDisplaying The callback function to call when this method is finished executing.
 * @param {TuneSearch} tuneSearch An object containing the details of the current search.
 */
function startDisplaying(onFinishedDisplaying, tuneSearch) {
   console.log("Started: Result displaying");
   clearTable();
   if (tuneSearch.rankedTunes.length > 0) {
      console.log("   Best result: " + tuneIndex[tuneSearch.rankedTunes[0].tune_id].file_name);
      const tHead = document.createElement("thead");
      tHead.classList.add("table-dark");
      tHead.classList.add("fw-bold");
      const hRow = document.createElement("tr");
      //Header rank column
      const hCellRank = document.createElement("td");
      hCellRank.textContent = getTranslation("Rank", "Rang");
      hCellRank.classList.add("text-center");
      hCellRank.setAttribute("data-i18n-key", "Rank");
      hRow.appendChild(hCellRank);
      //Header name column
      const hCellTuneName = document.createElement("td");
      hCellTuneName.textContent = getTranslation("Title", "Titre");
      hCellTuneName.classList.add("text-center");
      hCellTuneName.setAttribute("data-i18n-key", "Title");
      hRow.appendChild(hCellTuneName);
      //Header score column
      const hCellScore = document.createElement("td");
      hCellScore.textContent = getTranslation("Score", "Score");
      hCellScore.classList.add("text-center");
      hCellScore.setAttribute("data-i18n-key", "Score");
      hRow.appendChild(hCellScore);
      tHead.appendChild(hRow);
      resultTable.appendChild(tHead);
      const tBody = document.createElement("tbody");
      for (let i = 0, max = tuneSearch.rankedTunes.length; i < max; i++) {
         let tune = tuneIndex[tuneSearch.rankedTunes[i].tune_id];
         //Tune rank column
         const bRow = document.createElement("tr");
         const bCellRank = document.createElement("td");
         bCellRank.textContent = i + 1;
         bRow.appendChild(bCellRank);
         //Tune name column
         const bCellTuneName = document.createElement("td");
         const bCellTuneNameLink = document.createElement("a");
         bCellTuneNameLink.setAttribute("style", "white-space: pre;");
         bCellTuneNameLink.textContent = tune.file_name.replaceAll(";", "\r\n");
         bCellTuneNameLink.href = "https://ludovical.github.io/Partitions/" + tune.file_name.replaceAll(" ", "%20").replaceAll(";", "%3B").replaceAll("#", "%23") + ".pdf";
         bCellTuneNameLink.target = "_blank";
         bCellTuneNameLink.rel = "noopener noreferrer";
         bCellTuneName.appendChild(bCellTuneNameLink);
         bRow.appendChild(bCellTuneName);
         //Tune score column
         const bCellScore = document.createElement("td");
         let score = tuneSearch.rankedTunes[i].score;
         //Score > 0.65 = Very close ; > 0.5 = Close ; > 0.2 = Possible ; Unlikely
         switch (true) {
            case (score >= 0.65):
               bCellScore.classList.add("table-success");
               break;
            case (score >= 0.50):
               bCellScore.classList.add("table-info");
               break;
            case (score >= 0.20):
               bCellScore.classList.add("table-warning");
               break;
            default:
               bCellScore.classList.add("table-danger");
               break;
         }
         bCellScore.textContent = (score * 100).toFixed(1) + "%";
         bCellScore.classList.add("text-end");
         bRow.appendChild(bCellScore);
         tBody.appendChild(bRow);
      };
      resultTable.appendChild(tBody);
  } else {
      console.log("   Best result: 0 result to display");
      const cell = document.createElement("td");
      cell.textContent = getTranslation("zeroResult", "0 résultat. Essayez de nouveau!");
      cell.classList.add("fw-bolder");
      const row = document.createElement("tr");
      row.appendChild(cell);
      resultTable.appendChild(row);
   }
   console.log("Finished: Result displaying");
   onFinishedDisplaying(tuneSearch);
}

/**
 * Clears the result table of all its data.
 */
function clearTable() {
   resultTable.innerHTML = "";
}
