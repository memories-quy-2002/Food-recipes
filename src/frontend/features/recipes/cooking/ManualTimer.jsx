import React, { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";

const DEFAULT_MINUTES = 15; const MIN_MINUTES = 1; const MAX_MINUTES = 120;
export const formatTimerSeconds = (seconds) => { const safeSeconds = Math.max(0, Number(seconds) || 0); const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0"); const remainder = Math.floor(safeSeconds % 60).toString().padStart(2, "0"); return `${minutes}:${remainder}`; };
const ManualTimer = () => {
	const [durationMinutes, setDurationMinutes] = useState(DEFAULT_MINUTES); const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_MINUTES * 60); const [isRunning, setIsRunning] = useState(false); const [hasStarted, setHasStarted] = useState(false);
	useEffect(() => { if (!isRunning) return undefined; const intervalId = window.setInterval(() => setRemainingSeconds((current) => { if (current <= 1) { setIsRunning(false); return 0; } return current - 1; }), 1000); return () => window.clearInterval(intervalId); }, [isRunning]);
	const reset = () => { setIsRunning(false); setHasStarted(false); setRemainingSeconds(durationMinutes * 60); };
	const start = () => { if (remainingSeconds <= 0) setRemainingSeconds(durationMinutes * 60); setHasStarted(true); setIsRunning(true); };
	const updateDuration = (event) => { const nextMinutes = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Number(event.target.value) || MIN_MINUTES)); setDurationMinutes(nextMinutes); if (!isRunning) setRemainingSeconds(nextMinutes * 60); };
	return <section className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="manual-timer-title"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Timer className="size-5 text-primary" /><h2 id="manual-timer-title" className="text-lg font-black">Manual timer</h2></div><p className="mt-1 text-sm text-muted-foreground">Set a timer for the current step and keep this screen open while it runs.</p></div><strong className="tabular-nums text-4xl font-black tracking-tight text-foreground sm:text-5xl" aria-live="polite">{formatTimerSeconds(remainingSeconds)}</strong></div><div className="mt-5 grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-end"><label htmlFor="manual-timer-minutes" className="grid gap-2 text-sm font-bold">Minutes<Input id="manual-timer-minutes" type="number" min={MIN_MINUTES} max={MAX_MINUTES} value={durationMinutes} disabled={isRunning} onChange={updateDuration} /></label><div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">{isRunning ? <Button type="button" variant="secondary" onClick={() => setIsRunning(false)}><Pause className="size-4" />Pause</Button> : <Button type="button" onClick={start}><Play className="size-4" />{hasStarted && remainingSeconds > 0 ? "Resume" : "Start"}</Button>}<Button type="button" variant="outline" onClick={reset}><RotateCcw className="size-4" />Reset</Button></div></div></section>;
};
export default ManualTimer;
