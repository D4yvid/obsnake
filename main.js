const { Plugin, View, WorkspaceLeaf, Notice } = require('obsidian');

/**
 * @type {{start:()=>void,stop:()=>void,onKeyDown:(event:KeyboardEvent)=>void,tick:()=>void}[]} games
 */
const games = [];

const SNAKE_VIEW = 'SnakeView';
const TILE_SIZE = 32;

/**
 * @param {HTMLCanvasElement} canvas
 */
function createGame(canvas) {
	const ctx = canvas.getContext('2d');

	const width = canvas.width;
	const height = canvas.height;

	const UP = { x: 0, y: -1 };
	const DOWN = { x: 0, y: 1 };
	const LEFT = { x: -1, y: 0 };
	const RIGHT = { x: 1, y: 0 };

	const tilesWidth = Math.floor(width / TILE_SIZE);
	const tilesHeight = Math.floor(height / TILE_SIZE);

	let running = false;

	let snake = {
		dx: 1,
		dy: 0,
		x: 0,
		y: 0,
		size: 3,

		/** @type {{x:number,y:number}[]} tail */
		tail: []
	};

	let apple = generateApple();

	function generateApple() {
		return {
			x: Math.floor(Math.random() * tilesWidth),
			y: Math.floor(Math.random() * tilesHeight)
		}
	}

	function move(direction) {
		if (snake.dx == -direction.x || snake.dy == -direction.y) {
			return;
		}

		snake.dx = direction.x;
		snake.dy = direction.y;
	}

	function start() {
		running = true;
	}

	function stop() {
		running = false;
	}

	function update() {
		snake.x += snake.dx;
		snake.y += snake.dy;

		if (snake.x >= tilesWidth) {
			snake.x = 0;
		} else if (snake.x < 0) {
			snake.x = tilesWidth - 1;
		}

		if (snake.y > tilesHeight) {
			snake.y = 0;
		} else if (snake.y < 0) {
			snake.y = tilesHeight;
		}

		if (snake.x == apple.x && snake.y == apple.y) {
			snake.size++;
			apple = generateApple();
		}

		let head = { x: snake.x, y: snake.y };

		snake.tail.push(head);

		while (snake.tail.length > snake.size)
			snake.tail.shift();
	}

	function render() {
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, width, height);

		ctx.fillStyle = 'red';
		ctx.fillRect(apple.x * TILE_SIZE, apple.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

		for (const tail of snake.tail) {
			ctx.fillStyle = 'green';

			ctx.fillRect(tail.x * TILE_SIZE, tail.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		}
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	function onKeyDown(event) {
		switch (event.key) {
			case 'ArrowUp': move(UP); break;
			case 'ArrowDown': move(DOWN); break;
			case 'ArrowLeft': move(LEFT); break;
			case 'ArrowRight': move(RIGHT); break;
		}
	}

	function tick() {
		if (!running) {
			games.remove(this);
			return;
		}

		update();
		render();
	}

	return { start, stop, onKeyDown, tick };
}


class SnakeView extends View {

  /**
   * @param {Plugin} plugin
   * @param {WorkspaceLeaf} leaf
   */
  constructor(leaf, plugin) {
    super(leaf);

    this.plugin = plugin;
		this.gameInstance = null;
  }

  getDisplayText() {
    return "Snake Game";
  }

  getViewType() {
    return SNAKE_VIEW;
  }

  async onOpen() {
		try {
			const width  = this.containerEl.parentElement.parentElement.offsetWidth;
			const height = this.containerEl.parentElement.parentElement.offsetHeight;

			const canvas = this.containerEl.createEl('canvas');

			canvas.width = width;
			canvas.height = height;

			this.containerEl.appendChild(canvas);

			games.push(this.gameInstance = createGame(canvas));

			this.gameInstance.start();
		} catch (error) {
			new Notice('Error: ' + error);
		}
  }

  async onClose() {
		this.gameInstance.stop();
  }

}

module.exports = class SnakePlugin extends Plugin {

  async onload() {
    this.registerView(...this.snakeView());
    this.addCommand(this.snakeCommand());

		this.registerInterval(setInterval(() => {
			for (const game of games) {
				game.tick();
			}
		}, 1000 / 12));

		this.registerDomEvent(window, 'keydown', (keydown) => {
			for (const game of games) {
				game.onKeyDown(keydown);
			}
		});
  }

	snakeView = () => [
		SNAKE_VIEW,
		(leaf) => new SnakeView(leaf, this)
	];

	snakeCommand = () => ({
		id: 'play-snake',
		name: 'Play Snake',

		callback: async () => {
			let leaves = this.app.workspace.getLeavesOfType(SNAKE_VIEW);
			let leaf = null;

			if (leaves.length > 0) {
				leaf = leaves[0];
			} else {
				leaf = this.app.workspace.getLeaf(true);

				await leaf.setViewState({ type: SNAKE_VIEW, active: true });
			}

			this.app.workspace.revealLeaf(leaf);
		}
	});

}
