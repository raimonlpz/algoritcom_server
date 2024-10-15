import { Server } from "socket.io";
import random from "random-name";
import pathfinding from "pathfinding";

const io = new Server({
  cors: {
    origin: "http://localhost:5173",
  },
});

io.listen(3001);

const players = [];
let drunkie = {};

const fence = {
  size: [4, 1],
};

const map = {
  size: [10, 10],
  gridDivision: 2,
  items: [
    // Top
    {
      ...fence,
      gridPosition: [0, 0],
    },
    {
      ...fence,
      gridPosition: [4, 0],
    },
    {
      ...fence,
      gridPosition: [8, 0],
    },
    {
      ...fence,
      gridPosition: [12, 0],
    },
    {
      ...fence,
      gridPosition: [16, 0],
    },
    // Bottom
    {
      ...fence,
      gridPosition: [0, 19],
    },
    {
      ...fence,
      gridPosition: [4, 19],
    },
    {
      ...fence,
      gridPosition: [8, 19],
    },
    {
      ...fence,
      gridPosition: [12, 19],
    },
    {
      ...fence,
      gridPosition: [16, 19],
    },
    // Left
    {
      ...fence,
      gridPosition: [0, 0],
      rotation: 1,
    },
    {
      ...fence,
      gridPosition: [0, 4],
      rotation: 1,
    },
    {
      ...fence,
      gridPosition: [0, 8],
      rotation: 1,
    },
    {
      ...fence,
      gridPosition: [0, 12],
      rotation: 1,
    },
    {
      ...fence,
      gridPosition: [0, 16],
      rotation: 1,
    },
    // Right
    {
      ...fence,
      gridPosition: [19, 0],
      rotation: 1,
    },
    {
      ...fence,
      gridPosition: [19, 4],
      rotation: 1,
    },
    {
      ...fence,
      gridPosition: [19, 8],
      rotation: 1,
    },
    {
      ...fence,
      gridPosition: [19, 12],
      rotation: 1,
    },
    {
      ...fence,
      gridPosition: [19, 16],
      rotation: 1,
    },
    // Center
    {
      ...fence,
      gridPosition: [8, 8],
    },
    {
      ...fence,
      gridPosition: [8, 11],
    },
    {
      ...fence,
      gridPosition: [8, 8],
      rotation: 1,
    },
    {
      ...fence,
      gridPosition: [11, 8],
      rotation: 1,
    },
  ],
};

const grid = new pathfinding.Grid(
  map.size[0] * map.gridDivision,
  map.size[1] * map.gridDivision
);

const finder = new pathfinding.AStarFinder({
  allowDiagonal: true,
  dontCrossCorners: true,
});

const findPath = (start, end) => {
  const gridClone = grid.clone();
  const path = finder.findPath(start[0], start[1], end[0], end[1], gridClone);
  return path;
};

const updateGrid = () => {
  map.items.forEach((item) => {
    const width =
      item.rotation === 1 || item.rotation === 3 ? item.size[1] : item.size[0];
    const height =
      item.rotation === 1 || item.rotation === 3 ? item.size[0] : item.size[1];
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        grid.setWalkableAt(
          item.gridPosition[0] + x,
          item.gridPosition[1] + y,
          false
        );
      }
    }
  });
};

updateGrid();

const generateRandomPosition = () => {
  for (let i = 0; i < 100; i++) {
    const { size, gridDivision } = map;
    const x = Math.floor(Math.random() * size[0] * gridDivision);
    const y = Math.floor(Math.random() * size[1] * gridDivision);
    if (grid.isWalkableAt(x, y)) {
      return [x, y];
    }
  }
};

io.on("connection", (socket) => {
  console.log("user connected");

  players.push({
    id: socket.id,
    name: `${random.first()} ${random.last()}`,
    position: generateRandomPosition(),
    cansCount: 0,
  });

  drunkie.position = generateRandomPosition();

  socket.emit("initPlayer", {
    map,
    players,
    drunkie,
    id: socket.id,
  });

  io.emit("players", players);

  socket.on("disconnect", () => {
    console.log("user disconnected");
    players.splice(
      players.findIndex((player) => player.id === socket.id),
      1
    );
    io.emit("players", players);
  });

  socket.on("run", (from, to) => {
    const player = players.find((player) => player.id === socket.id);
    const path = findPath(from, to);
    if (!path) return;
    player.position = from;
    player.path = path;
    io.emit("run", player);
  });

  socket.on("canCollected", () => {
    const player = players.find((player) => player.id === socket.id);
    player.cansCount++;
    io.emit("canCollected", player);
  });

  socket.on("canRobbed", () => {
    const player = players.find((player) => player.id === socket.id);
    if (player.cansCount > 0) {
      player.cansCount--;
    }
    io.emit("canRobbed", player);
  });

  socket.on("jump", (user) => {
    io.emit("jump", user);
  });
  socket.on("dance", (user) => {
    io.emit("dance", user);
  });

  setInterval(() => {
    const from = drunkie.position;
    const to = generateRandomPosition();
    const path = findPath(from, to);
    if (!path) return;
    drunkie.position = to;
    drunkie.path = path;
    io.emit("drunkieMove", drunkie);
  }, 4000);
});
