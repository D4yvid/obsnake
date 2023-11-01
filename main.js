const { Plugin, View, WorkspaceLeaf } = require('obsidian');

const updateCalbacks = [];

/**
 * @param {Plugin} plugin
 */
async function playTetrisCommand(plugin) {
  let leaves = plugin.app.workspace.getLeavesOfType(TETRIS_VIEW);
  let leaf = null;

  if (leaves.length > 0) {
    leaf = leaves[0];
  } else {
    leaf = plugin.app.workspace.getLeaf(true);

    await leaf.setViewState({ type: TETRIS_VIEW, active: true });
  }

  plugin.app.workspace.revealLeaf(leaf);
}

class TetrisPlugin extends Plugin {

  async onload() {
    this.registerView(
      TETRIS_VIEW,
      (leaf) => new TetrisView(leaf, this)
    );

    this.addCommand({
      id: 'play-tetris',
      name: 'Play tetris',
      callback: async () => await playTetrisCommand(this)
    });

    this.registerInterval(setInterval(() => this.update(), 1000 / 30));
  }

  update() {
    for (const callback of updateCalbacks) {
      callback.execute(callback, this);
    }
  }

}

class TetrisGame {

	/**
		* @param {CanvasRenderingContext2D} ctx
		*/
	constructor(ctx, width, height) {
		this.ctx = ctx;

		this.width = width;
		this.height = height;

		this.x = 0;
		this.y = 0;
	}

	update() {
	}

	render() {
	}

}

const TETRIS_VIEW = 'TetrisView';

class TetrisView extends View {

  /**
   * @param {Plugin} plugin
   * @param {WorkspaceLeaf} leaf
   */
  constructor(leaf, plugin) {
    super(leaf);

    this.plugin = plugin;
  }

  getDisplayText() {
    return "Tetris";
  }

  getViewType() {
    return TETRIS_VIEW;
  }

  async onOpen() {
		const canvas = this.containerEl.createEl('canvas');
		const ctx = canvas.getContext('2d');

		const width = canvas.width = window.innerWidth;
		const height = canvas.height = window.innerHeight;

		let x = 0, y = 0;

		updateCalbacks.push({
			execute(self, plugin) {
				y += 10;

				if (y >= (height - 10)) {
					y = 0;
					x += 10;
				}

				x = x % width;

				ctx.fillStyle = 'black';
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				ctx.fillStyle = 'white';
				ctx.fillRect(x, y, 10, 10);
			}
		});

		this.containerEl.appendChild(canvas);
  }

  async onClose() {
  }

}

module.exports = TetrisPlugin;
