import { Container, Graphics } from "pixi.js";

export class Enemy {
  readonly graphics: Graphics;
  readonly container: Container;
  private readonly path: [number, number][];
  private pathIndex: number;
  private speed: number;
  private healthAmount: number;
  private readonly maxHealth: number;
  private readonly health: Graphics;
  isDead: boolean;

  constructor() {
    const container = new Container();
    this.isDead = false;
    this.container = container;
    const graphics = new Graphics();
    this.path = [
      [-32, 128 + 32],
      [192 + 32, 128 + 32],
      [192 + 32, 256 + 32],
      [352 + 64, 256 + 32],
    ];
    this.healthAmount = 100;
    this.maxHealth = 100;
    graphics
      .beginFill(0xaa4444)
      .lineStyle(4, 0xffffff, 0.1, 0)
      .drawCircle(20, 20, 20)
      .endFill();

    const healthBarContainer = new Container();
    healthBarContainer.position.set(0, 0);
    const healthBar = new Graphics();
    healthBar
      .beginFill(0xff0000)
      .lineStyle(1, 0x000000, undefined, 0)
      .drawRect(0, 0, 40, 10)
      .endFill();

    const health = new Graphics();
    health
      .beginFill(0x00ff00)
      .lineStyle(1, 0x00000, undefined, 0)
      .drawRect(0, 0, 40, 10)
      .endFill();
    this.health = health;
    healthBarContainer.addChild(healthBar);
    healthBarContainer.addChild(this.health);
    healthBarContainer.position.set(0, -20);
    // healthBar.addChild(this.health);
    // container.addChild(healthBar);
    container.addChild(graphics);
    container.addChild(healthBarContainer);
    container.pivot.set(20, 20);
    container.position.set(this.path[0][0], this.path[0][1]);
    this.graphics = graphics;
    this.pathIndex = 0;
    this.speed = 0.8;
  }

  move(delta: number): void {
    const xDiff = Math.round(
      this.path[this.pathIndex][0] - this.container.position.x
    );
    const yDiff = Math.round(
      this.path[this.pathIndex][1] - this.container.position.y
    );

    if (xDiff === 0 && yDiff === 0) {
      this.pathIndex += 1;
      if (this.path.length === this.pathIndex) {
        throw new OutOfBoundsError();
      }
    }

    this.container.position.x +=
      xDiff > 0 ? this.speed * delta : -this.speed * delta;
    this.container.position.y +=
      yDiff > 0 ? this.speed * delta : -this.speed * delta;
  }

  public takeDamage(damage: number): void {
    this.healthAmount -= damage;

    if (this.healthAmount <= 0) {
      this.isDead = true;
      throw new EnemyKilledError();
    }

    const healthRatio = this.healthAmount / this.maxHealth;
    this.health.scale.set(healthRatio, 1);
  }
}

export class OutOfBoundsError extends Error {}

export class EnemyKilledError extends Error {}
