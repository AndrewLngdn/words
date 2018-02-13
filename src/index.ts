import { css } from "glamor"

css.global("html, body", {
	padding: 0,
	margin: 0,
})

//////////////////////////////////////////////////////////////////////////
// Setup
//////////////////////////////////////////////////////////////////////////

const canvas = document.createElement("canvas")
canvas.height = window.innerHeight
canvas.width = window.innerWidth
document.body.appendChild(canvas)

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
if (!ctx) {
	throw new Error("Fuck")
}

//////////////////////////////////////////////////////////////////////////
// Drawing Helpers
//////////////////////////////////////////////////////////////////////////

function clear() {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function circle(args: { x: number; y: number; r: number; fill: string }) {
	ctx.beginPath()
	ctx.arc(args.x, args.y, args.r, 0, 2 * Math.PI, false)
	ctx.fillStyle = args.fill
	ctx.fill()
}

function box(args: {
	top: number
	bottom: number
	left: number
	right: number
	stroke: string
}) {
	ctx.strokeStyle = args.stroke
	ctx.strokeRect(
		args.top,
		args.left,
		args.right - args.left,
		args.bottom - args.top
	)
}

//////////////////////////////////////////////////////////////////////////
// State
//////////////////////////////////////////////////////////////////////////

interface Point {
	x: number
	y: number
}

interface State {
	balls: Array<{ position: Point; velocity: Point }>
}

const config = {
	initialBalls: 10,
	initialSpeed: 5,
	ballRadius: 10,
	rectBounds: {
		top: 10,
		bottom: canvas.height - 100,
		left: 10,
		right: canvas.width - 100,
	},
}

const state: State = {
	balls: Array(config.initialBalls)
		.fill(0)
		.map(() => ({
			position: {
				x: Math.random() * canvas.height - config.ballRadius,
				y: Math.random() * canvas.width - config.ballRadius,
			},
			velocity: {
				x: Math.random() * config.initialSpeed,
				y: Math.random() * config.initialSpeed,
			},
		})),
}

function update() {
	for (const ball of state.balls) {
		// Update position.
		ball.position.x += ball.velocity.x
		ball.position.y += ball.velocity.y
		// Keep in bounds.
		if (ball.position.x - config.ballRadius < config.rectBounds.left) {
			ball.position.x *= -1
			ball.velocity.x *= -1
		}
		if (ball.position.x + config.ballRadius > config.rectBounds.right) {
			ball.position.x = 2 * config.rectBounds.right - ball.position.x
			ball.velocity.x *= -1
		}
		if (ball.position.y - config.ballRadius < config.rectBounds.top) {
			ball.position.y *= -1
			ball.velocity.y *= -1
		}
		if (ball.position.y + config.ballRadius > config.rectBounds.bottom) {
			ball.position.y = 2 * config.rectBounds.bottom - ball.position.y
			ball.velocity.y *= -1
		}
	}
}

//////////////////////////////////////////////////////////////////////////
// Draw
//////////////////////////////////////////////////////////////////////////

function draw() {
	clear()

	box({
		...config.rectBounds,
		stroke: "#000000",
	})

	for (const ball of state.balls) {
		circle({
			x: ball.position.x,
			y: ball.position.y,
			r: config.ballRadius,
			fill: "#000000",
		})
	}
}

//////////////////////////////////////////////////////////////////////////
// Loop
//////////////////////////////////////////////////////////////////////////

function loop() {
	update()
	draw()
	requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
