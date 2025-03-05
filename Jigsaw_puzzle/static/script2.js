document.addEventListener("DOMContentLoaded", function () {
  const piecesContainer = document.querySelector(".pieces-container");
  const gridContainer = document.querySelector(".grid-container");
  const timerDisplay = document.getElementById("timer");
  const resetBtn = document.getElementById("reset-btn");

  let timeLeft = 180; // 3 minutes
  // For a 4x3 grid:
  gamePaused=false;
  // let gridColumns = ''||4;
  // let gridRows = ''||3;
  let imageSrc = ""||'sample.jpg'; // This should be set by your backend via loadPuzzleImage()
  let pieces = [];
  let timerInterval;

  // Start the game timer
  function startTimer() {
    const timerElement = document.getElementById("timer");
    timerInterval = setInterval(() => {
      let minutes = Math.floor(timeLeft / 60);
      let seconds = timeLeft % 60;
      seconds = seconds < 10 ? "0" + seconds : seconds;
      timerElement.textContent = `${minutes}:${seconds}`;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        alert("Time's up!");
      }
      timeLeft--;
    }, 1000);
  }

  // Create drop zones (grid cells)
  function createDropZones(pieceSize) {
    gridContainer.innerHTML = "";
    gridContainer.style.width = `${pieceSize * gridColumns}px`;
    gridContainer.style.height = `${pieceSize * gridRows}px`;
    for (let i = 0; i < gridColumns * gridRows; i++) {
      let x = i % gridColumns;
      let y = Math.floor(i / gridColumns);
      let dropZone = document.createElement("div");
      dropZone.classList.add("drop-zone");
      dropZone.dataset.index = i;
      dropZone.style.width = pieceSize + "px";
      dropZone.style.height = pieceSize + "px";
      dropZone.style.left = `${x * pieceSize}px`;
      dropZone.style.top = `${y * pieceSize}px`;
      gridContainer.appendChild(dropZone);
    }
  }

  // Create puzzle pieces and slice the image correctly
  function createPuzzlePieces(pieceSize, containerWidth, containerHeight) {
    piecesContainer.innerHTML = "";
    pieces = [];
    // Set container height (for a 4x3 grid, height = pieceSize * gridRows)
    piecesContainer.style.height = `${pieceSize * gridRows}px`;
    for (let i = 0; i < gridColumns * gridRows; i++) {
      let x = i % gridColumns;
      let y = Math.floor(i / gridColumns);
      let piece = document.createElement("div");
      piece.classList.add("puzzle-piece");
      piece.style.width = pieceSize + "px";
      piece.style.height = pieceSize + "px";
      piece.style.backgroundImage = `url(${imageSrc})`;
      // Background size ensures the full image is spread over the grid
      piece.style.backgroundSize = `${containerWidth}px ${containerHeight}px`;
      piece.style.backgroundPosition = `${-x * pieceSize}px ${-y * pieceSize  }px`;
      piece.style.boxShadow = "2px 4px 4px black";
      piece.dataset.index = i;
      piece.setAttribute("draggable", true);

      // Randomly position the piece within the container bounds
      let randomLeft = Math.floor(Math.random() * (containerWidth - pieceSize));
      let randomTop = Math.floor(Math.random() * (containerHeight - pieceSize));
      piece.style.left = `${randomLeft}px`;
      piece.style.top = `${randomTop}px`;

      piecesContainer.appendChild(piece);
      pieces.push(piece);
    }
  }

  // Drag & drop functionality
  function addDragAndDrop() {
    let draggedPiece = null;
    let offsetX = 0,
      offsetY = 0;

    pieces.forEach((piece) => {
      // Desktop drag events
      piece.addEventListener("dragstart", function (e) {
        draggedPiece = this;
        setTimeout(() => this.classList.add("dragging"), 0);
      });

      piece.addEventListener("dragend", function () {
        this.classList.remove("dragging");
        draggedPiece = null;
        checkWin();
      });

      // Touch drag events
      piece.addEventListener("touchstart", function (e) {
        draggedPiece = this;
        let touch = e.touches[0];
        const pieceRect = draggedPiece.getBoundingClientRect();
        offsetX = touch.clientX - pieceRect.left;
        offsetY = touch.clientY - pieceRect.top;
        draggedPiece.style.zIndex = "1000";
        e.preventDefault();
      });

      piece.addEventListener("touchmove", function (e) {
        if (!draggedPiece) return;
        let touch = e.touches[0];
        const containerRect = piecesContainer.getBoundingClientRect();
        const x = touch.clientX - containerRect.left - offsetX;
        const y = touch.clientY - containerRect.top - offsetY;
        draggedPiece.style.left = `${x}px`;
        draggedPiece.style.top = `${y}px`;
        e.preventDefault();
      });

      piece.addEventListener("touchend", function () {
        if (!draggedPiece) return;
        checkDropZone(draggedPiece);
        draggedPiece.style.zIndex = "1";
        draggedPiece = null;
        checkWin();
      });
    });

    // Drop zone events
    document.querySelectorAll(".drop-zone").forEach((zone) => {
      zone.addEventListener("dragover", function (e) {
        e.preventDefault();
      });

      zone.addEventListener("drop", function (e) {
        e.preventDefault();
        if (
          draggedPiece &&
          this.childElementCount === 0 &&
          this.dataset.index === draggedPiece.dataset.index
        ) {
          snapToGrid(draggedPiece, this);
        }
      });

      zone.addEventListener("touchend", function (e) {
        if (!draggedPiece) return;
        checkDropZone(draggedPiece);
      });
    });

    // Check drop zone based on center point of the dragged piece
    function checkDropZone(piece) {
      let pieceRect = piece.getBoundingClientRect();
      let centerX = pieceRect.left + pieceRect.width / 2;
      let centerY = pieceRect.top + pieceRect.height / 2;

      document.querySelectorAll(".drop-zone").forEach((zone) => {
        let zoneRect = zone.getBoundingClientRect();
        if (
          centerX >= zoneRect.left &&
          centerX <= zoneRect.right &&
          centerY >= zoneRect.top &&
          centerY <= zoneRect.bottom &&
          zone.childElementCount === 0 &&
          zone.dataset.index === piece.dataset.index
        ) {
          snapToGrid(piece, zone);
        }
      });
    }

    // Snap the piece into its drop zone
    function snapToGrid(piece, zone) {
      zone.appendChild(piece);
      piece.style.position = "relative";
      piece.style.left = "0";
      piece.style.top = "0";
      piece.style.transform = "none"; // Cancel drag transform
      piece.style.pointerEvents = "none"; // Disable dragging again once placed
      piece.draggable = false;
    }
  }

  // Check if all pieces are correctly placed
  function checkWin() {
    const allZones = document.querySelectorAll(".drop-zone");
    let correctCount = 0;
    allZones.forEach((zone) => {
      if (
        zone.firstElementChild &&
        zone.firstElementChild.dataset.index === zone.dataset.index
      ) {
        correctCount++;
      }
    });
    if (correctCount === gridColumns * gridRows) {
      clearInterval(timerInterval);
      const popup = document.getElementById("popup"); 
      // Ensure this exists in HTML
      if (popup) popup.style.display = "block";
    
               






  // Calculate the time taken by subtracting the remaining time from the initial total time (180 seconds)
  let timeTakenInSeconds = 180 - timeLeft; // Total time - time left = time taken

  let minutesTaken = Math.floor(timeTakenInSeconds / 60);
  let secondsTaken = timeTakenInSeconds % 60;

  let formattedTime = (minutesTaken < 10 ? "0" : "") + minutesTaken + ":" + (secondsTaken < 10 ? "0" : "") + secondsTaken;


  document.getElementById("timer-leader").textContent = formattedTime;

  console.log("Time taken: ", formattedTime); // Log the time taken
     
    }
  }

  // Initialize or reinitialize the puzzle
  function initPuzzle() {
    // Get the current width of the pieces container (responsive)
    const containerWidth = piecesContainer.clientWidth;
    // Compute the piece size based on the number of columns
    const pieceSize = containerWidth / gridColumns;
    // For a 4×3 grid, set container height to maintain aspect ratio
    const containerHeight = pieceSize * gridRows;

    // Adjust container dimensions
    piecesContainer.style.height = `${containerHeight}px`;
    gridContainer.style.height = `${containerHeight}px`;

    createDropZones(pieceSize);
    createPuzzlePieces(pieceSize, containerWidth, containerHeight);
    addDragAndDrop();
  }


  // Reinitialize puzzle on window resize with a slight delay
  window.addEventListener("resize", () => {
    setTimeout(initPuzzle,loadGridSettings, 300);
  });



  // Fetch puzzle image from the backend and update pieces if available
  function loadPuzzleImage() {
    fetch("/get_puzzle_image")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched puzzle image:", data.puzzle_image);
        // imagedispcontainer.style.backgroundImage =  `url('${data.puzzle_image}')`;
        if (data.puzzle_image) {
          // imageSrc = data.puzzle_image;
          let container = document.querySelector('.imagedispcontainer');
          // Set the background image
              container.style.backgroundImage = `url(${data.puzzle_image})`;

          // Update existing pieces if any
          document.querySelectorAll(".puzzle-piece").forEach((piece) => {
            piece.style.backgroundImage = `url('${data.puzzle_image}')`;
            //imagedispcontainer
            
          });
        } else {
          // imageSrc = 'static/img/defaultpuzzle.jpg';
          console.error("No puzzle image found in the response.");
        }
      })
      .catch((error) => console.error("Error loading puzzle image:", error));
  }

  // Fetch background image from backend and apply it
  function loadBackgroundImage() {
    fetch("/get_bg_image")
      .then((response) => response.json())
      .then((data) => {
        if (data.bg_image) {
          document.body.style.backgroundImage = `url('${data.bg_image}')`;
        }
        else {
          document.body.style.backgroundImage = `url('static/img/bg1.jpeg')`;

        }
      })
      .catch((error) =>
        console.error("Error loading background image:", error)
      );
  }

  //Fetch the gridcolumns and gridrows from the backend and apply it
  function loadGridSettings() {

  }
  function checkToggleState() {
    fetch('/get_toggle_state')
    .then(response => response.json())
    .then(data => {
          if (data.toggle) {
            document.getElementById('puzzleButton').style.display = 'block';  // Show button when toggle is ON
        } else {
            document.getElementById('puzzleButton').style.display = 'none';  // Hide button when toggle is OFF
        }
    });
  }

  // On page load, get images and initialize the puzzle
  window.onload = function () {
    fetch("/get_grid_settings")
    .then((response) => response.json())
    .then((data) => {
      gridRows = data.grid_rows || 3;
      gridColumns = data.grid_columns || 4;
      initPuzzle();
      startTimer();
      console.log("Grid Settings:", data);
    })
    .catch((error) => console.error("Error loading grid settings:", error));
     
    initializeMain();
    checkToggleState();
    loadPuzzleImage();
    loadBackgroundImage();
    
     

  };

  function initializeMain() {
    const hintButton = document.getElementById('hintButton');
    
    // Function to update button visibility
    function updateButtonVisibility() {
        const isHidden = localStorage.getItem('hintToggle') === 'true';
        hintButton.style.display = isHidden ? 'none' : 'block';
    }

    // Initial check
    updateButtonVisibility();

    // Listen for storage changes from other windows
    window.addEventListener('storage', updateButtonVisibility);

    // Check periodically
    setInterval(updateButtonVisibility, 1000);
}

  // Optional: expose a back function
  window.backtoindex = function () {
    window.location.href = "/";
  };
});
function checkhint(){
  document.getElementById("imagedisplay").style.display = "block";

  setTimeout(() => {
    imagedisplay.style.display = "none"; // Hide after 2 seconds
}, 2000); // 2000ms = 2 seconds
}

