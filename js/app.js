let allResults = [];
let currentPage = 0;
const PAGE_SIZE = 30;

const analyzeButton = document.getElementById("analyze_button"); // Finds and stores the HTML element analyze_button

const resetButton = document.getElementById("reset_button");

resetButton.addEventListener("click", function () {

    document.getElementById("dna_sequence").value = "";

    document.getElementById("results").innerHTML = "";

    allResults = [];

    currentPage = 0;

    window.serverMessage = "";
});

function complement(base) { // Returns complementary base pair or the same character if no match is found.
    const pairs = {
        A: "T",
        T: "A",
        C: "G",
        G: "C"
    };

    return pairs[base] || base; 
}

function renderPage(sequence, sequenceLength) {

    const resultsDiv = document.getElementById("results");

    resultsDiv.innerHTML = `
    <hr class="results-divider">
    <h1>Results</h1>

    <div class="fragment-legend">
        L = Left Fragment Size, R = Right Fragment Size<br>
        Fragment sizes are calculated using cut positions defined on the sense strand (5' --> 3').<br>The antisense offsets are used only for visualization.
    </div>

    ${getPaginationControlsHTML()}
`;

    if (allResults.length === 0) {

        if (window.serverMessage) {
            resultsDiv.innerHTML += `<p>${window.serverMessage}</p>`;
        } else {
            resultsDiv.innerHTML += "<p>No matching enzymes found.</p>";
        }

        return;
}

    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    const pageData = allResults.slice(start, end);

    pageData.forEach(r => {
           
        const cutPositionsHTML = r.cuts
            .map(c => c.top)   // converts to 1-based mapping
            .join(", ");

        const fragmentSizesHTML = r.fragments.join(", ");

        const charWidth = 20;

        const startX = 60;

        const highlightRects = r.cuts.map(cut => {

    return r.recognition_sequence
        .split("")
        .map((base, i) => {

            // Skip highlighting fully degenerate bases
            if (base === "N") {
                return "";
            }

            const x =
                startX + ((cut.position + i) * charWidth);

            return `
                <rect
                    x="${x - (charWidth / 2)}"
                    y="24"
                    width="${charWidth}"
                    height="24"
                    fill="#dddddd"
                />

                <rect
                    x="${x - (charWidth / 2)}"
                    y="74"
                    width="${charWidth}"
                    height="24"
                    fill="#dddddd"
                />
            `;
        })
        .join("");

}).join("");

        const antisense =
            sequence
                .split("")
                .map(complement)
                .join("");

        const cutLines = r.cuts.map((cut, i) => {

            const leftFragment = r.fragments[i];

            const rightFragment = r.fragments[i + 1];

            const topX =
                startX + (cut.top * charWidth) - (charWidth / 2);

            const bottomX =
                startX + (cut.bottom * charWidth) - (charWidth / 2);

            return `
                <!-- TOP LABEL -->
                <text
                    x="${topX}"
                    y="15"
                    font-size="12"
                    text-anchor="middle"
                >
                    bp ${cut.top}
                </text>

                <!-- LEFT BOTTOM FRAGMENT -->
                <text
                    x="${bottomX}"
                    y="${112}"
                    font-size="12"
                    text-anchor="middle"
                >
                    L: ${leftFragment} bp
                </text>

                <!-- RIGHT BOTTOM FRAGMENT -->
                <text
                    x="${bottomX}"
                    y="${126}"
                    font-size="12"
                    text-anchor="middle"
                >
                    R: ${rightFragment} bp
                </text>

                <!-- TOP CUT LINE -->
                <line
                    x1="${topX}"
                    y1="20"
                    x2="${topX}"
                    y2="60"
                    stroke="red"
                    stroke-width="2"
                />

                <!-- CONNECTOR -->
                <line
                    x1="${topX}"
                    y1="60"
                    x2="${bottomX}"
                    y2="60"
                    stroke="red"
                    stroke-width="2"
                />

                <!-- BOTTOM CUT LINE -->
                <line
                    x1="${bottomX}"
                    y1="60"
                    x2="${bottomX}"
                    y2="100"
                    stroke="red"
                    stroke-width="2"
                />
            `;
        }).join("");

        const svgWidth = startX + (sequenceLength * charWidth) + 100;

        const senseText = sequence
        .split("")
        .map((base, i) => `
            <text
                x="${startX + (i * charWidth)}"
                y="40"
                font-family="monospace"
                font-size="20"
                text-anchor="middle"
            >
                ${base}
            </text>
        `)
        .join("");

        const antisenseText = antisense
            .split("")
            .map((base, i) => `
                <text
                    x="${startX + (i * charWidth)}"
                    y="90"
                    font-family="monospace"
                    font-size="20"
                    text-anchor="middle"
                >
                    ${base}
                </text>
            `)
            .join("");

        const block = `
            <div class="enzyme-block">

                <h3 class="enzyme-title">${r.enzyme}</h3>

                <svg width="${svgWidth}" height="140">

                ${highlightRects}

                    <!-- Sense Strand -->

                    <text
                        x="20"
                        y="40"
                        font-family="monospace"
                        font-size="20">
                        5'
                    </text>

                    ${senseText}

                    <!-- Antisense Strand -->

                    <text
                        x="20"
                        y="90"
                        font-family="monospace"
                        font-size="20">
                        3'
                    </text>

                    ${antisenseText}

                    <!-- Cleavage Visualization -->

                    <!-- TOP CUT -->

                  ${cutLines}

                </svg>

                <div class="summary">
                    <div>
                        <strong>Cut positions:</strong> ${cutPositionsHTML}
                    </div>

                    <div>
                        <strong>Fragment sizes:</strong> ${fragmentSizesHTML}
                    </div>
                </div>
            </div>
        `;

        resultsDiv.innerHTML += block;

            });

    resultsDiv.innerHTML += getPaginationControlsHTML();

    attachPaginationEvents(sequence, sequenceLength);
}

function getPaginationControlsHTML() {

    const totalPages = Math.ceil(allResults.length / PAGE_SIZE);

    let pagesHTML = "";

    for (let i = 0; i < totalPages; i++) {

        const isCurrent = i === currentPage;

        pagesHTML += `
            <span
                class="page-number ${isCurrent ? "active-page" : ""}"
                data-page="${i}"
            >
                ${i + 1}
            </span>
        `;
    }

    if (totalPages <= 1) {
    return "";
    }

    return `
        <div class="pagination-controls" style="margin:20px 0;">
            Pages: ${pagesHTML}
        </div>
    `;
}

function attachPaginationEvents(sequence, sequenceLength) {

    const pageButtons = document.querySelectorAll(".page-number");

    pageButtons.forEach(button => {

        button.onclick = () => {

            currentPage = Number(button.dataset.page);

            renderPage(sequence, sequenceLength);
        };
    });
}

analyzeButton.addEventListener("click", async function () {
    
    const sequence = document.getElementById("dna_sequence").value.toUpperCase(); // Finds and stores the HTML element dna_sequence which is the input entered by the user
    const sequenceLength = sequence.length; 

    const response = await fetch(`/cgi-bin/analysis.cgi?sequence=${sequence}`); // Sends the input through the URL query string to the cgi script.

    const text = await response.text(); // The cgi script returns a JSON file.

    try {
        const data = JSON.parse(text); // Attempts to convert JSON text into a javascript object
        allResults = data.results || [];
        window.serverMessage = data.message || "";
        currentPage = 0;

        renderPage(sequence, sequenceLength);
        
    } catch (e) { // Catches any errors
        console.error("Invalid JSON from server");
    }
});