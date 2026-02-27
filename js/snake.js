const Direction = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

class Snake {
    constructor(gridCols, gridRows, cellSize) {
        this.gridCols = gridCols;
        this.gridRows = gridRows;
        this.cellSize = cellSize;
        this.body = [];
        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;
        this.growing = false;
        this.animationFrame = 0;
        this.init();
    }

    init() {
        const startX = Math.floor(this.gridCols / 4);
        const startY = Math.floor(this.gridRows / 2);
        
        this.body = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        
        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;
        this.growing = false;
    }

    setDirection(newDirection) {
        if (this.isOppositeDirection(newDirection)) {
            return;
        }
        this.nextDirection = newDirection;
    }

    isOppositeDirection(newDirection) {
        return (this.direction.x + newDirection.x === 0) && 
               (this.direction.y + newDirection.y === 0);
    }

    move() {
        this.direction = this.nextDirection;
        
        const head = this.body[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };
        
        this.body.unshift(newHead);
        
        if (!this.growing) {
            this.body.pop();
        } else {
            this.growing = false;
        }
        
        this.animationFrame++;
    }

    grow() {
        this.growing = true;
    }

    checkWallCollision() {
        const head = this.body[0];
        return head.x < 0 || head.x >= this.gridCols || 
               head.y < 0 || head.y >= this.gridRows;
    }

    checkSelfCollision() {
        const head = this.body[0];
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }
        return false;
    }

    checkCollision() {
        return this.checkWallCollision() || this.checkSelfCollision();
    }

    checkFoodCollision(food) {
        const head = this.body[0];
        const foodPos = food.getPosition();
        return head.x === foodPos.x && head.y === foodPos.y;
    }

    draw(ctx) {
        for (let i = this.body.length - 1; i >= 0; i--) {
            const segment = this.body[i];
            const x = segment.x * this.cellSize;
            const y = segment.y * this.cellSize;
            const size = this.cellSize;
            
            if (i === 0) {
                this.drawHead(ctx, x, y, size);
            } else {
                this.drawBody(ctx, x, y, size, i);
            }
        }
    }

    drawHead(ctx, x, y, size) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size * 0.45;
        
        const gradient = ctx.createRadialGradient(
            centerX - radius * 0.3, centerY - radius * 0.3, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.5, '#e63946');
        gradient.addColorStop(1, '#9d0208');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        this.drawFestiveHat(ctx, centerX, centerY, radius);
        this.drawCuteFace(ctx, centerX, centerY, radius);
    }

    drawFestiveHat(ctx, centerX, centerY, radius) {
        const hatOffset = this.direction === Direction.DOWN ? radius * 0.8 : -radius * 0.6;
        const hatY = centerY + hatOffset;
        
        ctx.save();
        
        if (this.direction === Direction.DOWN) {
            ctx.translate(centerX, hatY);
            ctx.rotate(Math.PI);
        } else {
            ctx.translate(centerX, hatY);
        }
        
        ctx.beginPath();
        ctx.moveTo(-radius * 0.5, 0);
        ctx.lineTo(0, -radius * 0.8);
        ctx.lineTo(radius * 0.5, 0);
        ctx.closePath();
        
        const hatGradient = ctx.createLinearGradient(0, 0, 0, -radius * 0.8);
        hatGradient.addColorStop(0, '#ffd700');
        hatGradient.addColorStop(1, '#ff6b6b');
        ctx.fillStyle = hatGradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(0, -radius * 0.8, radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        
        ctx.restore();
    }

    drawCuteFace(ctx, centerX, centerY, radius) {
        const eyeOffsetX = radius * 0.25;
        const eyeOffsetY = radius * 0.1;
        const eyeSize = radius * 0.2;
        
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        
        if (this.direction === Direction.RIGHT) {
            leftEyeX = centerX + eyeOffsetX;
            leftEyeY = centerY - eyeOffsetY;
            rightEyeX = centerX + eyeOffsetX;
            rightEyeY = centerY + eyeOffsetY;
        } else if (this.direction === Direction.LEFT) {
            leftEyeX = centerX - eyeOffsetX;
            leftEyeY = centerY - eyeOffsetY;
            rightEyeX = centerX - eyeOffsetX;
            rightEyeY = centerY + eyeOffsetY;
        } else if (this.direction === Direction.UP) {
            leftEyeX = centerX - eyeOffsetX;
            leftEyeY = centerY - eyeOffsetY;
            rightEyeX = centerX + eyeOffsetX;
            rightEyeY = centerY - eyeOffsetY;
        } else {
            leftEyeX = centerX - eyeOffsetX;
            leftEyeY = centerY + eyeOffsetY;
            rightEyeX = centerX + eyeOffsetX;
            rightEyeY = centerY + eyeOffsetY;
        }
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(leftEyeX, leftEyeY, eyeSize * 1.3, eyeSize * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightEyeX, rightEyeY, eyeSize * 1.3, eyeSize * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(leftEyeX + eyeSize * 0.2, leftEyeY, eyeSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEyeX + eyeSize * 0.2, rightEyeY, eyeSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(leftEyeX + eyeSize * 0.3, leftEyeY - eyeSize * 0.3, eyeSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEyeX + eyeSize * 0.3, rightEyeY - eyeSize * 0.3, eyeSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        const blushOffset = radius * 0.35;
        ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
        ctx.beginPath();
        ctx.ellipse(centerX - blushOffset, centerY + radius * 0.15, radius * 0.12, radius * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + blushOffset, centerY + radius * 0.15, radius * 0.12, radius * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const mouthY = centerY + radius * 0.25;
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, mouthY - radius * 0.1, radius * 0.12, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
    }

    drawBody(ctx, x, y, size, index) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size * 0.42;
        
        const hue = 0;
        const saturation = 80 - (index * 1) % 30;
        const lightness = 45 - (index * 0.5) % 15;
        
        const gradient = ctx.createRadialGradient(
            centerX - radius * 0.3, centerY - radius * 0.3, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness + 20}%)`);
        gradient.addColorStop(0.7, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
        gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        if (index % 3 === 0) {
            this.drawPattern(ctx, centerX, centerY, radius, index);
        }
    }

    drawPattern(ctx, centerX, centerY, radius, index) {
        const patterns = ['lantern', 'cloud', 'coin'];
        const pattern = patterns[index % patterns.length];
        
        ctx.save();
        ctx.globalAlpha = 0.7;
        
        switch (pattern) {
            case 'lantern':
                this.drawMiniLantern(ctx, centerX, centerY, radius * 0.4);
                break;
            case 'cloud':
                this.drawMiniCloud(ctx, centerX, centerY, radius * 0.35);
                break;
            case 'coin':
                this.drawMiniCoin(ctx, centerX, centerY, radius * 0.35);
                break;
        }
        
        ctx.restore();
    }

    drawMiniLantern(ctx, x, y, size) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.8, size, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.6, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMiniCloud(ctx, x, y, size) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(x - size * 0.4, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x, y - size * 0.2, size * 0.6, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMiniCoin(ctx, x, y, size) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#b8860b';
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('福', x, y + 1);
    }

    getHead() {
        return this.body[0];
    }

    getLength() {
        return this.body.length;
    }
}
