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

function line(args: { start: Point; end: Point; stroke: string }) {
	ctx.beginPath()
	ctx.moveTo(args.start.x, args.start.y)
	ctx.lineTo(args.end.x, args.end.y)
	ctx.strokeStyle = args.stroke
	ctx.stroke()
}

//////////////////////////////////////////////////////////////////////////
// State
//////////////////////////////////////////////////////////////////////////

interface Point {
	x: number
	y: number
}

interface MouseDownState {
	down: true
	start: Point
	current: Point
}

interface MouseUpState {
	down: false
}

interface WallState {
	complete: boolean
	// The directions from the mouse
	origin: Point
	direction: Point
	// The progress of the walls getting built.
	left: Point
	right: Point
}

interface State {
	balls: Array<{ position: Point; velocity: Point }>
	mouse: MouseUpState | MouseDownState
	walls: Array<WallState>
}

const rectBounds = {
	top: 10,
	bottom: canvas.height - 100,
	left: 10,
	right: canvas.width - 10,
}

const rectSize = {
	width: rectBounds.right - rectBounds.left,
	height: rectBounds.bottom - rectBounds.top,
}

const config = {
	initialBalls: 10,
	initialSpeed: 5,
	ballRadius: 10,
	wallSpeed: 7,
}

const state: State = {
	balls: Array(config.initialBalls)
		.fill(0)
		.map(() => ({
			position: {
				x: Math.random() * rectSize.width - 2 * config.ballRadius,
				y: Math.random() * rectSize.height - 2 * config.ballRadius,
			},
			velocity: {
				x: (Math.random() - 0.5) * config.initialSpeed,
				y: (Math.random() - 0.5) * config.initialSpeed,
			},
		})),
	mouse: { down: false },
	walls: [],
}

window["state"] = state

canvas.addEventListener("mousedown", event => {
	state.mouse = {
		down: true,
		start: {
			x: event.pageX - canvas.offsetLeft,
			y: event.pageY - canvas.offsetTop,
		},
		current: {
			x: event.pageX - canvas.offsetLeft,
			y: event.pageY - canvas.offsetTop,
		},
	}
})

canvas.addEventListener("mousemove", event => {
	if (state.mouse.down) {
		state.mouse = {
			...state.mouse,
			current: {
				x: event.pageX - canvas.offsetLeft,
				y: event.pageY - canvas.offsetTop,
			},
		}
	}
})

canvas.addEventListener("mouseup", event => {
	if (state.mouse.down) {
		state.walls.push({
			complete: false,
			origin: state.mouse.start,
			direction: dir(state.mouse.start, state.mouse.current),
			left: state.mouse.start,
			right: state.mouse.start,
		})
		state.mouse = {
			down: false,
		}
	}
})

function inBounds(p: Point) {
	return (
		p.x > rectBounds.left &&
		p.x < rectBounds.right &&
		p.y > rectBounds.top &&
		p.y < rectBounds.bottom
	)
}

function diff(p1: Point, p2: Point) {
	return { x: p1.x - p2.x, y: p1.y - p2.y }
}

function l2(p: Point) {
	return Math.sqrt(p.x * p.x + p.y * p.y)
}

function norm(p: Point) {
	const d = l2(p)
	return { x: p.x / d, y: p.y / d }
}

function dir(p1: Point, p2: Point) {
	return norm(diff(p1, p2))
}

function bound(p: Point) {
	if (p.x < rectBounds.left) {
		p.x = rectBounds.left
	}
	if (p.x > rectBounds.right) {
		p.x = rectBounds.right
	}
	if (p.y < rectBounds.top) {
		p.y = rectBounds.top
	}
	if (p.y > rectBounds.bottom) {
		p.y = rectBounds.bottom
	}
	return p
}

function update() {
	for (const wall of state.walls) {
		if (!wall.complete) {
			if (inBounds(wall.left)) {
				wall.left = bound({
					x: wall.left.x - wall.direction.x * config.wallSpeed,
					y: wall.left.y - wall.direction.y * config.wallSpeed,
				})
			}
			if (inBounds(wall.right)) {
				wall.right = bound({
					x: wall.right.x + wall.direction.x * config.wallSpeed,
					y: wall.right.y + wall.direction.y * config.wallSpeed,
				})
			}
			if (!inBounds(wall.left) && !inBounds(wall.right)) {
				wall.complete = true
			}
		}
	}

	for (const ball of state.balls) {
		// Update position.
		ball.position.x += ball.velocity.x
		ball.position.y += ball.velocity.y
		// Keep in rect bounds.
		if (ball.position.x - config.ballRadius < 0) {
			ball.position.x += -1 * (ball.position.x - config.ballRadius)
			ball.velocity.x *= -1
		}
		if (ball.position.x + config.ballRadius > rectSize.width) {
			ball.position.x -= ball.position.x + config.ballRadius - rectSize.width
			ball.velocity.x *= -1
		}
		if (ball.position.y - config.ballRadius < 0) {
			ball.position.y += -1 * (ball.position.y - config.ballRadius)
			ball.velocity.y *= -1
		}
		if (ball.position.y + config.ballRadius > rectSize.height) {
			ball.position.y -= ball.position.y + config.ballRadius - rectSize.height
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
		...rectBounds,
		stroke: "#000000",
	})

	for (const ball of state.balls) {
		circle({
			x: ball.position.x + rectBounds.left,
			y: ball.position.y + rectBounds.top,
			r: config.ballRadius,
			fill: "#000000",
		})
	}

	if (state.mouse.down) {
		line({
			start: state.mouse.start,
			end: state.mouse.current,
			stroke: "#FF0000",
		})
	}

	for (const wall of state.walls) {
		line({
			start: wall.left,
			end: wall.right,
			stroke: "#00FF00",
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
