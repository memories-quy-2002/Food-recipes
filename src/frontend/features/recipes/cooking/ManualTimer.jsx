import React, { useEffect, useState } from "react";

const DEFAULT_MINUTES = 15;
const MIN_MINUTES = 1;
const MAX_MINUTES = 120;

export const formatTimerSeconds = (seconds) => {
	const safeSeconds = Math.max(0, Number(seconds) || 0);
	const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
	const remainder = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
	return `${minutes}:${remainder}`;
};

const ManualTimer = () => {
	const [durationMinutes, setDurationMinutes] = useState(DEFAULT_MINUTES);
	const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_MINUTES * 60);
	const [isRunning, setIsRunning] = useState(false);
	const [hasStarted, setHasStarted] = useState(false);

	useEffect(() => {
		if (!isRunning) return undefined;
		const intervalId = window.setInterval(() => {
			setRemainingSeconds((current) => {
				if (current <= 1) {
					setIsRunning(false);
					return 0;
				}
				return current - 1;
			});
		}, 1000);
		return () => window.clearInterval(intervalId);
	}, [isRunning]);

	const reset = () => {
		setIsRunning(false);
		setHasStarted(false);
		setRemainingSeconds(durationMinutes * 60);
	};

	const start = () => {
		if (remainingSeconds <= 0) setRemainingSeconds(durationMinutes * 60);
		setHasStarted(true);
		setIsRunning(true);
	};

	const updateDuration = (event) => {
		const nextMinutes = Math.min(
			MAX_MINUTES,
			Math.max(MIN_MINUTES, Number(event.target.value) || MIN_MINUTES),
		);
		setDurationMinutes(nextMinutes);
		if (!isRunning) setRemainingSeconds(nextMinutes * 60);
	};

	return (
		<section className="cooking-mode__timer" aria-labelledby="manual-timer-title">
			<div className="cooking-mode__timer__header">
				<div>
					<h2 id="manual-timer-title">Manual timer</h2>
					<p>Set a timer for this step. You can leave the screen open while it runs.</p>
				</div>
				<strong aria-live="polite">{formatTimerSeconds(remainingSeconds)}</strong>
			</div>
			<label htmlFor="manual-timer-minutes">Minutes</label>
			<input
				id="manual-timer-minutes"
				type="number"
				min={MIN_MINUTES}
				max={MAX_MINUTES}
				value={durationMinutes}
				disabled={isRunning}
				onChange={updateDuration}
			/>
			<div className="cooking-mode__timer__actions">
				{isRunning ? (
					<button type="button" onClick={() => setIsRunning(false)}>Pause timer</button>
				) : (
					<button type="button" onClick={start}>Start timer</button>
				)}
				{!isRunning && hasStarted && remainingSeconds > 0 && (
					<button type="button" onClick={start}>Resume timer</button>
				)}
				<button type="button" onClick={reset}>Reset timer</button>
			</div>
		</section>
	);
};

export default ManualTimer;
