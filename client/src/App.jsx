import { useEffect, useState } from "react";
import "./App.css";
import Square from "./components/square/square";
import { io } from "socket.io-client";
import Swal from "sweetalert2";

const renderFrom = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

function App() {
  const [gameState, setGameState] = useState(renderFrom);
  const [currentPlayer, setCurrentPlayer] = useState("circle");
  const [finishedState, setFinishedState] = useState(false);
  const [finishedArrayState, setFinishedArrayState] = useState([]);
  const [playOnline, setPlayOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState(null);
  const [playingAs, setPlayingAs] = useState(null);

  const checkWinner = () => {
    // Row check
    for (let row = 0; row < gameState.length; row++) {
      if (
        gameState[row][0] &&
        gameState[row][0] === gameState[row][1] &&
        gameState[row][1] === gameState[row][2]
      ) {
        setFinishedArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2]);
        return gameState[row][0];
      }
    }

    // Column check
    for (let col = 0; col < gameState[0].length; col++) {
      if (
        gameState[0][col] &&
        gameState[0][col] === gameState[1][col] &&
        gameState[1][col] === gameState[2][col]
      ) {
        setFinishedArrayState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col]);
        return gameState[0][col];
      }
    }

    // Diagonal check (top-left to bottom-right)
    if (
      gameState[0][0] &&
      gameState[0][0] === gameState[1][1] &&
      gameState[1][1] === gameState[2][2]
    ) {
      setFinishedArrayState([0, 4, 8]);
      return gameState[0][0];
    }

    // Diagonal check (top-right to bottom-left)
    if (
      gameState[0][2] &&
      gameState[0][2] === gameState[1][1] &&
      gameState[1][1] === gameState[2][0]
    ) {
      setFinishedArrayState([2, 4, 6]);
      return gameState[0][2];
    }

    // Draw match check
    const isMatchDraw = gameState
      .flat()
      .every((e) => e === "circle" || e === "cross");
    if (isMatchDraw) return "draw";

    return null;
  };

  useEffect(() => {
    const winner = checkWinner();
    if (winner) {
      setFinishedState(winner);
    }
  }, [gameState]);

  const takePlayerName = async () => {
    const result = await Swal.fire({
      title: "Enter your name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });
    return result;
  };

  socket?.on("opponentLeftMatch", () => {
    setFinishedState("opponentLeftMatch");
  });

  socket?.on("playerMoveFromServer", (data) => {
    const id = data.state.id;
    setGameState((prevState) => {
      let newState = [...prevState];
      const rowIndex = Math.floor(id / 3);
      const colIndex = id % 3;
      newState[rowIndex][colIndex] = data.state.sign;
      return newState;
    });
    setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
  });

  socket?.on("OpponentNotFound", function () {
    setOpponentName(false);
  });

  socket?.on("OpponentFound", function (data) {
    setPlayingAs(data.playingAs);
    setOpponentName(data.opponentName);
  });

  async function playOnlineClick() {
    const result = await takePlayerName();

    if (!result.isConfirmed) {
      return;
    }

    const username = result.value;
    setPlayerName(username);

    const newSocket = io("http://localhost:5000", {
      autoConnect: true,
    });

    newSocket?.emit("request_to_play", {
      playerName: username,
    });

    setSocket(newSocket);
    setPlayOnline(true);
  }

  if (!playOnline)
    return (
      <div className="flex justify-center items-center h-screen">
        <button
          className="bg-black/50 text-2xl font-bold rounded-lg outline-none p-5 text-white cursor-pointer"
          onClick={playOnlineClick}
        >
          Play Online
        </button>
      </div>
    );

  if (playOnline && !opponentName) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-2cl text-white">Waiting for opponent...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col justify-center items-center text-white p-10">
        <div className="flex justify-between items-center py-5 w-96">
          <div
            className={`w-32 h-10 rounded-2xl text-center pt-1 text-xl ${
              currentPlayer === playingAs ? "bg-blue-500" : "bg-black/50"
            }`}
          >
            {playerName}
          </div>
          <div
            className={`w-32 h-10 rounded-2xl text-center pt-1 text-xl ${
              currentPlayer !== playingAs ? "bg-red-500" : "bg-black/50"
            }`}
          >
            {opponentName || "Opponent"}
          </div>
        </div>
        <div>
          <h1 className="py-2 px-4 text-5xl bg-black/50 rounded-md text-center">
            Tic Tac Toe
          </h1>
          <div className="grid py-5 grid-cols-3 gap-4">
            {gameState.map((sqr, rowindex) =>
              sqr.map((e, colindex) => (
                <Square
                  id={rowindex * 3 + colindex}
                  key={rowindex * 3 + colindex}
                  gameState={gameState}
                  setGameState={setGameState}
                  currentPlayer={currentPlayer}
                  setCurrentPlayer={setCurrentPlayer}
                  finishedState={finishedState}
                  finishedArrayState={finishedArrayState}
                  socket={socket}
                  playingAs={playingAs}
                />
              ))
            )}
          </div>
          {finishedState && finishedState !== "draw" && (
            <h3
              className={`text-xl font-bold text-center bg-black/50 rounded-lg p-2 ${
                finishedState === playingAs ? "text-green-500" : "text-red-500"
              }`}
            >
              {finishedState === playingAs
                ? "You won the game!"
                : "You lost the game!"}
            </h3>
          )}
          {finishedState && finishedState === "draw" && (
            <h3 className="text-xl text-center bg-black/50 rounded-lg p-2">
              It&apos;s a Draw
            </h3>
          )}
        </div>
        {finishedState && finishedState === "opponentLeftMatch" && (
          <h2>Your opponent left the match, you win!</h2>
        )}
      </div>
    </>
  );
}

export default App;
