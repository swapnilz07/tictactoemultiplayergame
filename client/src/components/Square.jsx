/* eslint-disable react/prop-types */
import CircleIcon from "../assets/circle.png";
import CrossIcon from "../assets/cross.png";

export default function Square({
  id,
  gameState,
  setGameState,
  currentPlayer,
  setCurrentPlayer,
  finishedState,
  finishedArrayState,
  playingAs,
  socket,
}) {
  const rowIndex = Math.floor(id / 3);
  const colIndex = id % 3;

  // Determine icon based on gameState
  const currentElement = gameState[rowIndex][colIndex];
  const icon =
    currentElement === "circle"
      ? CircleIcon
      : currentElement === "cross"
      ? CrossIcon
      : null;

  const clickOnSquare = () => {
    if (finishedState || icon || currentPlayer !== playingAs) {
      return;
    }

    const myCurrentPlayer = currentPlayer;
    socket.emit("playerMoveFromClient", {
      state: {
        id,
        sign: myCurrentPlayer,
      },
    });

    setCurrentPlayer(currentPlayer === "circle" ? "cross" : "circle");

    setGameState((prevState) => {
      let newState = [...prevState];
      newState[rowIndex][colIndex] = myCurrentPlayer;
      return newState;
    });
  };

  const getWinnerBackgroundClass = () => {
    if (finishedArrayState.includes(id)) {
      if (finishedState === "circle") return "bg-blue-500";
      if (finishedState === "cross") return "bg-red-500";
    }
    return "";
  };

  return (
    <div
      className={`size-24 bg-black/50 rounded-md hover:cursor-pointer flex justify-center items-center p-7 
        ${finishedState ? "!cursor-not-allowed" : ""} 
        ${getWinnerBackgroundClass()}`}
      onClick={clickOnSquare}
    >
      {icon && <img src={icon} alt="" />}
    </div>
  );
}
