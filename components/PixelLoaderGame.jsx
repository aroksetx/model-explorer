"use client";

import { useEffect, useRef, useState } from "react";

const WIDTH = 420;
const HEIGHT = 180;
const GROUND_Y = 142;
const PLAYER_X = 54;
const PLAYER_W = 16;
const PLAYER_H = 18;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function PixelLoaderGame() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const flashRef = useRef(0);
  const [hud, setHud] = useState({ score: 0, dodges: 0, hits: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      return undefined;
    }

    const state = {
      playerY: GROUND_Y - PLAYER_H,
      playerVY: 0,
      score: 0,
      hits: 0,
      dodges: 0,
      obstacles: [
        { x: WIDTH + 40, width: 14, height: 20, speed: 3.3 },
        { x: WIDTH + 190, width: 18, height: 28, speed: 3.6 },
      ],
      lastTime: 0,
      lastHudUpdate: 0,
    };

    const jump = () => {
      if (state.playerY >= GROUND_Y - PLAYER_H - 0.1) {
        state.playerVY = -8.5;
      }
    };

    const onKeyDown = (event) => {
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        jump();
      }
    };

    const onPointerDown = () => {
      jump();
    };

    window.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("pointerdown", onPointerDown);

    const spawnObstacle = () => {
      const tall = Math.random() > 0.45;
      state.obstacles.push({
        x: WIDTH + 72 + Math.random() * 88,
        width: tall ? 18 : 14,
        height: tall ? 30 : 20,
        speed: 3.2 + Math.random() * 1.3,
      });
    };

    const intersects = (leftA, topA, widthA, heightA, leftB, topB, widthB, heightB) => {
      return leftA < leftB + widthB && leftA + widthA > leftB && topA < topB + heightB && topA + heightA > topB;
    };

    const drawScene = (time) => {
      context.clearRect(0, 0, WIDTH, HEIGHT);

      context.fillStyle = "#120f0e";
      context.fillRect(0, 0, WIDTH, HEIGHT);

      for (let i = 0; i < 22; i += 1) {
        const starX = (i * 31 + time * 0.035) % (WIDTH + 12);
        const starY = 14 + ((i * 17) % 78);
        context.fillStyle = i % 3 === 0 ? "rgba(255, 180, 148, 0.5)" : "rgba(208, 192, 180, 0.33)";
        context.fillRect(WIDTH - starX, starY, 2, 2);
      }

      for (let line = 0; line < HEIGHT; line += 4) {
        context.fillStyle = "rgba(255,255,255,0.02)";
        context.fillRect(0, line, WIDTH, 1);
      }

      context.fillStyle = "#2a201d";
      context.fillRect(0, GROUND_Y + 6, WIDTH, HEIGHT - (GROUND_Y + 6));

      for (let i = 0; i < WIDTH; i += 12) {
        context.fillStyle = i % 24 === 0 ? "#46342f" : "#362924";
        context.fillRect(i, GROUND_Y + 8, 10, 6);
      }

      const playerTop = state.playerY;
      context.fillStyle = "#ff8d57";
      context.fillRect(PLAYER_X, playerTop, PLAYER_W, PLAYER_H);
      context.fillStyle = "#fff5ef";
      context.fillRect(PLAYER_X + 4, playerTop + 5, 3, 3);
      context.fillRect(PLAYER_X + 10, playerTop + 5, 3, 3);
      context.fillStyle = "#552b1e";
      context.fillRect(PLAYER_X + 2, playerTop + 13, 12, 2);

      for (const obstacle of state.obstacles) {
        const obstacleTop = GROUND_Y - obstacle.height;
        context.fillStyle = "#ffd1bb";
        context.fillRect(obstacle.x, obstacleTop, obstacle.width, obstacle.height);
        context.fillStyle = "#4b2e23";
        context.fillRect(obstacle.x + 2, obstacleTop + 3, obstacle.width - 4, obstacle.height - 6);
      }

      if (flashRef.current > 0) {
        context.fillStyle = `rgba(255, 128, 86, ${clamp(flashRef.current / 9, 0, 0.38)})`;
        context.fillRect(0, 0, WIDTH, HEIGHT);
      }
    };

    const animate = (time) => {
      if (!state.lastTime) {
        state.lastTime = time;
      }

      const delta = Math.min(34, time - state.lastTime);
      state.lastTime = time;
      const frameFactor = delta / 16.67;

      state.playerVY += 0.48 * frameFactor;
      state.playerY += state.playerVY * frameFactor;

      if (state.playerY > GROUND_Y - PLAYER_H) {
        state.playerY = GROUND_Y - PLAYER_H;
        state.playerVY = 0;
      }

      for (let index = state.obstacles.length - 1; index >= 0; index -= 1) {
        const obstacle = state.obstacles[index];
        obstacle.x -= obstacle.speed * frameFactor;

        if (obstacle.x + obstacle.width < -6) {
          state.obstacles.splice(index, 1);
          state.dodges += 1;
        }
      }

      if (state.obstacles.length < 3 && state.obstacles[state.obstacles.length - 1].x < WIDTH - 110) {
        spawnObstacle();
      }

      for (const obstacle of state.obstacles) {
        const obstacleTop = GROUND_Y - obstacle.height;
        if (intersects(PLAYER_X, state.playerY, PLAYER_W, PLAYER_H, obstacle.x, obstacleTop, obstacle.width, obstacle.height)) {
          state.hits += 1;
          flashRef.current = 9;
          obstacle.x = WIDTH + 70 + Math.random() * 50;
        }
      }

      state.score += delta * 0.11;
      flashRef.current = Math.max(0, flashRef.current - 1);

      if (time - state.lastHudUpdate > 110) {
        state.lastHudUpdate = time;
        setHud({
          score: Math.floor(state.score),
          dodges: state.dodges,
          hits: state.hits,
        });
      }

      drawScene(time);
      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("pointerdown", onPointerDown);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <section className="loader-arcade" aria-live="polite">
      <div className="loader-head">
        <p className="loader-title">Syncing models registry...</p>
        <p className="loader-subtitle">Pixel run mode active while API responds</p>
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="loader-canvas"
        role="img"
        aria-label="Pixel game loader. Press Space or tap to jump."
      />
      <div className="loader-hud">
        <p>Score: {hud.score}</p>
        <p>Dodges: {hud.dodges}</p>
        <p>Hits: {hud.hits}</p>
      </div>
      <p className="loader-tip">Press Space / Arrow Up / Tap to jump</p>
    </section>
  );
}
