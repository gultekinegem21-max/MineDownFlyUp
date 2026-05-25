import { Block } from '../types';

export class GameEngine {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number = 400; // World width in tiles
    height: number = 120; // World height in tiles
    tileSize: number = 32;
    world: Uint8Array;
    
    camera = { x: 0, y: 0 };
    keys = new Set<string>();
    lastTime = 0;
    animationId = 0;
    
    player = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        width: 24,
        height: 56,
        speed: 250,
        jumpForce: 450,
        isGrounded: false,
        facingRight: true,
        isFlying: false
    };
    
    selectedBlock = Block.DIRT;
    isDragging = false;
    isPlacing = false;
    lastMouse = { x: 0, y: 0 };
    hoverTile = { x: -1, y: -1 };

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.world = new Uint8Array(this.width * this.height);
        
        this.generateWorld();

        // Place player at center of generated world
        const cx = this.width / 2;
        const cy = this.getHeight(cx);
        this.player.x = cx * this.tileSize;
        this.player.y = (cy - 3) * this.tileSize;

        this.camera.x = this.player.x + this.player.width / 2 - window.innerWidth / 2;
        this.camera.y = this.player.y + this.player.height / 2 - window.innerHeight / 2;

        this.onResize();
        this.bindEvents();
    }

    start() {
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    stop() {
        cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.onResize);
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        this.canvas.removeEventListener('contextmenu', this.onContextMenu);
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
    }

    generateWorld() {
        let lastTreeX = -10;

        for (let x = 0; x < this.width; x++) {
            const elevation = this.getHeight(x);
            for (let y = 0; y < this.height; y++) {
                let block = Block.AIR;

                if (y === this.height - 1) {
                    block = Block.ADMINIUM;
                } else if (y > elevation) {
                    const depth = y - elevation;
                    if (depth === 1) {
                        block = elevation > 80 ? Block.SAND : Block.GRASS;
                    } else if (depth < 5) {
                        block = elevation > 80 ? Block.SAND : Block.DIRT;
                    } else {
                        block = Block.STONE;
                    }
                } else if (y >= 81 && elevation > 80) {
                    // Fill sea level holes with water
                    if (y > elevation) continue;
                    block = Block.WATER;
                }

                // Trees logic
                if (block === Block.AIR && y === elevation && y <= 80 && x - lastTreeX > 4) {
                    if (Math.random() < 0.1) {
                        lastTreeX = x;
                        this.setBlock(x, y, Block.WOOD);
                        this.setBlock(x, y - 1, Block.WOOD);
                        this.setBlock(x, y - 2, Block.WOOD);
                        
                        // Leaves array
                        for (let lx = x - 2; lx <= x + 2; lx++) {
                            for (let ly = y - 4; ly <= y - 2; ly++) {
                                if (Math.abs(lx - x) === 2 && Math.abs(ly - (y - 2)) === 2) continue; // Round off tree corners
                                if (this.getBlock(lx, ly) === Block.AIR) {
                                    this.setBlock(lx, ly, Block.LEAVES);
                                }
                            }
                        }
                    }
                }

                if (block !== Block.AIR && this.getBlock(x, y) === Block.AIR) {
                    this.setBlock(x, y, block);
                }
            }
        }
    }

    getHeight(x: number) {
        const e1 = Math.sin(x / 20) * 10;
        const e2 = Math.sin(x / 5) * 2;
        const e3 = Math.sin(x / 50) * 15;
        return Math.floor(64 + e1 + e2 + e3); // 64 is middle sea level
    }

    getIndex(x: number, y: number) {
        return y * this.width + x;
    }

    getBlock(x: number, y: number): Block {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return Block.AIR;
        return this.world[this.getIndex(x, y)] as Block;
    }

    setBlock(x: number, y: number, block: Block) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        this.world[this.getIndex(x, y)] = block;
    }

    bindEvents() {
        window.addEventListener('resize', this.onResize);
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        this.canvas.addEventListener('contextmenu', this.onContextMenu);
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
    }

    onResize = () => {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    onKeyDown = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        if (key === 'f' && !this.keys.has(key)) {
            this.player.isFlying = !this.player.isFlying;
            if (this.player.isFlying) {
                this.player.vy = 0;
            }
        }
        this.keys.add(key);
    };
    onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
    onContextMenu = (e: MouseEvent) => e.preventDefault();

    onMouseDown = (e: MouseEvent) => {
        if (e.button === 0 || e.button === 2) { // Left or Right click
            this.isPlacing = true;
            this.handleAction(e.clientX, e.clientY, e.button === 2);
        }
    };

    onMouseMove = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        this.hoverTile = {
            x: Math.floor((cx + this.camera.x) / this.tileSize),
            y: Math.floor((cy + this.camera.y) / this.tileSize)
        };

        if (this.isPlacing) {
            // Determine if right click is held by checking buttons
            this.handleAction(e.clientX, e.clientY, (e.buttons & 2) !== 0);
        }
    };

    onMouseUp = (e: MouseEvent) => {
        if (e.button === 0 || e.button === 2) this.isPlacing = false;
    };

    handleAction(cx: number, cy: number, isRightClick: boolean = false) {
        // Prevent placing items under standard floating UI layers
        if (cy > window.innerHeight - 100) return; // Protect lower UI Area
        if (cx < 250 && cy < 150) return; // Protect upper left UI Area

        const wx = cx + this.camera.x;
        const wy = cy + this.camera.y;
        
        // Reach limit
        const dx = wx - (this.player.x + this.player.width / 2);
        const dy = wy - (this.player.y + this.player.height / 2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > this.tileSize * 6) return;

        const tx = Math.floor(wx / this.tileSize);
        const ty = Math.floor(wy / this.tileSize);

        // Right click breaks blocks, left click places (if block selected). Or if AIR selected, left click breaks.
        if (isRightClick || this.selectedBlock === Block.AIR) {
            if (this.getBlock(tx, ty) !== Block.AIR && this.getBlock(tx, ty) !== Block.ADMINIUM) {
                this.setBlock(tx, ty, Block.AIR);
            }
        } else {
            if (this.getBlock(tx, ty) === Block.AIR || this.getBlock(tx, ty) === Block.WATER) {
                // Ensure player doesn't place block inside themselves
                const isIntersectingPlayer = 
                    tx * this.tileSize < this.player.x + this.player.width &&
                    (tx + 1) * this.tileSize > this.player.x &&
                    ty * this.tileSize < this.player.y + this.player.height &&
                    (ty + 1) * this.tileSize > this.player.y;
                    
                if (!isIntersectingPlayer) {
                    this.setBlock(tx, ty, this.selectedBlock);
                }
            }
        }
    }

    loop = (time: number) => {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;
        this.update(dt);
        this.render();
        this.animationId = requestAnimationFrame(this.loop);
    }

    isSolid(block: Block) {
        return block !== Block.AIR && block !== Block.WATER;
    }

    checkCollisions(isX: boolean) {
        const ts = this.tileSize;
        const leftTile = Math.floor(this.player.x / ts);
        const rightTile = Math.floor((this.player.x + this.player.width - 0.1) / ts);
        const topTile = Math.floor(this.player.y / ts);
        const bottomTile = Math.floor((this.player.y + this.player.height - 0.1) / ts);

        if (isX) {
            for (let y = topTile; y <= bottomTile; y++) {
                if (this.player.vx < 0) { // Moving Left
                    if (this.isSolid(this.getBlock(leftTile, y))) {
                        this.player.x = (leftTile + 1) * ts;
                        this.player.vx = 0;
                        break;
                    }
                } else if (this.player.vx > 0) { // Moving Right
                    if (this.isSolid(this.getBlock(rightTile, y))) {
                        this.player.x = rightTile * ts - this.player.width;
                        this.player.vx = 0;
                        break;
                    }
                }
            }
        } else {
            this.player.isGrounded = false;
            for (let x = leftTile; x <= rightTile; x++) {
                if (this.player.vy < 0) { // Moving Up
                    if (this.isSolid(this.getBlock(x, topTile))) {
                        this.player.y = (topTile + 1) * ts;
                        this.player.vy = 0;
                        break;
                    }
                } else if (this.player.vy > 0) { // Moving Down
                    if (this.isSolid(this.getBlock(x, bottomTile))) {
                        this.player.y = bottomTile * ts - this.player.height;
                        this.player.vy = 0;
                        this.player.isGrounded = true;
                        break;
                    }
                }
            }
        }
    }

    update(dt: number) {
        // Player Input
        if (this.keys.has('a') || this.keys.has('arrowleft')) {
            this.player.vx = -this.player.speed;
            this.player.facingRight = false;
        } else if (this.keys.has('d') || this.keys.has('arrowright')) {
            this.player.vx = this.player.speed;
            this.player.facingRight = true;
        } else {
            this.player.vx = 0;
        }

        if (this.player.isFlying) {
            if (this.keys.has('w') || this.keys.has('arrowup') || this.keys.has(' ')) {
                this.player.vy = -this.player.speed;
            } else if (this.keys.has('s') || this.keys.has('arrowdown') || this.keys.has('shift')) {
                this.player.vy = this.player.speed;
            } else {
                this.player.vy = 0;
            }
        } else {
            if ((this.keys.has('w') || this.keys.has('arrowup') || this.keys.has(' ')) && this.player.isGrounded) {
                this.player.vy = -this.player.jumpForce;
                this.player.isGrounded = false;
            }
            this.player.vy += 1200 * dt; // Gravity
        }

        // Move X
        this.player.x += this.player.vx * dt;
        this.checkCollisions(true);

        // Move Y
        this.player.y += this.player.vy * dt;
        this.checkCollisions(false);

        // Smooth camera follow
        const targetCamX = this.player.x + this.player.width / 2 - this.canvas.width / 2;
        const targetCamY = this.player.y + this.player.height / 2 - this.canvas.height / 2;
        
        this.camera.x += (targetCamX - this.camera.x) * 5 * dt;
        this.camera.y += (targetCamY - this.camera.y) * 5 * dt;

        // Clamp camera
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.width * this.tileSize - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.height * this.tileSize - this.canvas.height));
    }

    drawBlock(block: Block, px: number, py: number, size: number) {
        const ctx = this.ctx;
        switch (block) {
            case Block.DIRT:
                ctx.fillStyle = '#79553A';
                ctx.fillRect(px, py, size, size);
                ctx.fillStyle = '#684830';
                ctx.fillRect(px + 4, py + 4, size / 4, size / 4);
                ctx.fillRect(px + size/2, py + size/2, size / 4, size / 4);
                break;
            case Block.GRASS:
                ctx.fillStyle = '#79553A';
                ctx.fillRect(px, py, size, size);
                ctx.fillStyle = '#597D27';
                ctx.fillRect(px, py, size, size * 0.3);
                ctx.fillRect(px, py + size * 0.3, size * 0.2, size * 0.2);
                ctx.fillRect(px + size * 0.5, py + size * 0.3, size * 0.2, size * 0.2);
                ctx.fillRect(px + size * 0.8, py + size * 0.3, size * 0.2, size * 0.1);
                break;
            case Block.STONE:
                ctx.fillStyle = '#7D7D7D';
                ctx.fillRect(px, py, size, size);
                ctx.fillStyle = '#6B6B6B';
                ctx.fillRect(px, py, size, size * 0.1);
                ctx.fillRect(px, py, size * 0.1, size);
                ctx.fillStyle = '#8F8F8F';
                ctx.fillRect(px + size * 0.9, py, size * 0.1, size);
                ctx.fillRect(px, py + size * 0.9, size, size * 0.1);
                break;
            case Block.WOOD:
                ctx.fillStyle = '#4A3B2C';
                ctx.fillRect(px, py, size, size);
                ctx.fillStyle = '#5C4A3D';
                ctx.fillRect(px + size * 0.2, py, size * 0.6, size);
                ctx.fillStyle = '#3A2B1C';
                ctx.fillRect(px + size * 0.4, py, size * 0.1, size);
                break;
            case Block.LEAVES:
                ctx.fillStyle = 'rgba(74, 124, 41, 0.9)';
                ctx.fillRect(px, py, size, size);
                ctx.fillStyle = 'rgba(54, 94, 21, 0.9)';
                ctx.fillRect(px + size*0.1, py + size*0.1, size*0.8, size*0.8);
                break;
            case Block.SAND:
                ctx.fillStyle = '#D2C18A';
                ctx.fillRect(px, py, size, size);
                ctx.fillStyle = '#C1B079';
                ctx.fillRect(px + size*0.2, py + size*0.8, size*0.2, size*0.1);
                ctx.fillRect(px + size*0.7, py + size*0.3, size*0.2, size*0.1);
                break;
            case Block.WATER:
                ctx.fillStyle = 'rgba(65, 105, 225, 0.6)';
                ctx.fillRect(px, py, size, size);
                break;
            case Block.BRICK:
                ctx.fillStyle = '#9C4A36';
                ctx.fillRect(px, py, size, size);
                ctx.fillStyle = '#D4D4D4'; // Mortar
                ctx.fillRect(px, py + size/2 - 1, size, 2);
                ctx.fillRect(px + size/2 - 1, py, 2, size/2);
                ctx.fillRect(px + size/4 - 1, py + size/2, 2, size/2);
                ctx.fillRect(px + size*0.75 - 1, py + size/2, 2, size/2);
                break;
            case Block.GLASS:
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(px, py, size, size);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(px + size * 0.2, py + size * 0.8);
                ctx.lineTo(px + size * 0.8, py + size * 0.2);
                ctx.stroke();
                ctx.strokeRect(px, py, size, size);
                break;
            case Block.ADMINIUM:
                ctx.fillStyle = '#222';
                ctx.fillRect(px, py, size, size);
                ctx.fillStyle = '#111';
                ctx.fillRect(px + 4, py + 4, size / 4, size / 4);
                break;
        }
    }

    drawPlayer() {
        const px = Math.floor(this.player.x - this.camera.x);
        const py = Math.floor(this.player.y - this.camera.y);
        
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(px + this.player.width / 2, py + this.player.height / 2);
        if (!this.player.facingRight) {
            ctx.scale(-1, 1);
        }
        
        // Body
        ctx.fillStyle = '#00AAAA';
        ctx.fillRect(-this.player.width / 2, -this.player.height / 2 + 16, this.player.width, 24);
        
        // Head
        ctx.fillStyle = '#FFCDB2';
        ctx.fillRect(-8, -this.player.height / 2, 16, 16);
        
        // Eyes
        ctx.fillStyle = 'white';
        ctx.fillRect(-4, -this.player.height / 2 + 4, 4, 4);
        ctx.fillRect(4, -this.player.height / 2 + 4, 4, 4);
        ctx.fillStyle = '#4B3621';
        ctx.fillRect(-2, -this.player.height / 2 + 6, 2, 2);
        ctx.fillRect(6, -this.player.height / 2 + 6, 2, 2);
        
        // Hair
        ctx.fillStyle = '#4B3621';
        ctx.fillRect(-8, -this.player.height / 2, 16, 4);
        ctx.fillRect(-8, -this.player.height / 2, 4, 8);
        
        // Legs
        ctx.fillStyle = '#3F3F74';
        if (this.player.vx !== 0 && this.player.isGrounded) {
             const offset = Math.sin(performance.now() / 100) * 4;
             ctx.fillRect(-this.player.width / 2 + 2, -this.player.height / 2 + 40, 8, 16 + offset);
             ctx.fillRect(this.player.width / 2 - 10, -this.player.height / 2 + 40, 8, 16 - offset);
        } else {
             ctx.fillRect(-this.player.width / 2 + 2, -this.player.height / 2 + 40, 8, 16);
             ctx.fillRect(this.player.width / 2 - 10, -this.player.height / 2 + 40, 8, 16);
        }

        ctx.restore();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const startCol = Math.max(0, Math.floor(this.camera.x / this.tileSize));
        const endCol = Math.min(this.width, startCol + Math.ceil(this.canvas.width / this.tileSize) + 1);
        const startRow = Math.max(0, Math.floor(this.camera.y / this.tileSize));
        const endRow = Math.min(this.height, startRow + Math.ceil(this.canvas.height / this.tileSize) + 1);

        for (let x = startCol; x < endCol; x++) {
            for (let y = startRow; y < endRow; y++) {
                const block = this.getBlock(x, y);
                if (block !== Block.AIR) {
                    const px = Math.floor(x * this.tileSize - this.camera.x);
                    const py = Math.floor(y * this.tileSize - this.camera.y);
                    this.drawBlock(block, px, py, this.tileSize);
                }
            }
        }

        this.drawPlayer();

        // Draw hover effect
        if (this.hoverTile.x !== -1) {
            const hx = Math.floor(this.hoverTile.x * this.tileSize - this.camera.x);
            const hy = Math.floor(this.hoverTile.y * this.tileSize - this.camera.y);
            
            // Check reach limit for visual feedback
            const wx = this.hoverTile.x * this.tileSize + this.tileSize/2;
            const wy = this.hoverTile.y * this.tileSize + this.tileSize/2;
            const dx = wx - (this.player.x + this.player.width / 2);
            const dy = wy - (this.player.y + this.player.height / 2);
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist <= this.tileSize * 6) {
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(hx, hy, this.tileSize, this.tileSize);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.fillRect(hx, hy, this.tileSize, this.tileSize);
            }
        }
    }
}
