import { Container, Graphics } from "pixi.js";
import { Enemy } from "./enemy";

export class Projectile {
  readonly target: Enemy;
  readonly graphics: Graphics;
  private readonly damage: number;

  constructor(target: Enemy, x: number, y: number, map: Container) {
    this.target = target;
    this.damage = 1;
    const graphics = new Graphics();
    graphics
      .beginFill(0x222222)
      // .lineStyle(4, 0xffffff, 0.1, 0)
      .drawCircle(0, 0, 3)
      .endFill();
    graphics.pivot.set(0, 0);
    graphics.position.set(x, y);
    this.graphics = graphics;
    this.target = target;
    map.addChild(this.graphics);
  }

  move(delta: number): void {
    const targetPosition = this.target.container.position;
    const ownPosition = this.graphics.position;

    const xDiff = targetPosition.x - ownPosition.x;
    const yDiff = targetPosition.y - ownPosition.y;

    const angle = Math.atan2(yDiff, xDiff);

    const newXPosition = ownPosition.x + Math.cos(angle) * delta * 5;
    const newYPosition = ownPosition.y + Math.sin(angle) * delta * 5;

    const ownRadius = 10;
    const enemyRadius = 20;

    const newXDiff = targetPosition.x - newXPosition;
    const newYDiff = targetPosition.y - newYPosition;

    const distanceBetweenOrigins = Math.hypot(newXDiff, newYDiff);

    // if (Math.round(newXDiff) === 0 && Math.round(newYDiff) === 0) {
    if (distanceBetweenOrigins <= 23) {
      this.target.takeDamage(this.damage);
      throw new HitEnemyError();
    }
    this.graphics.position.set(newXPosition, newYPosition);
  }
}

export class HitEnemyError extends Error {}
