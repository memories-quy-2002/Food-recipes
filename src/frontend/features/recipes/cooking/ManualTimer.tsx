import { useEffect, useState, type ChangeEvent, type ReactElement } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { defaultCookingToolsState, readCookingToolsState, writeCookingToolsState } from "./cookingToolsStorage";
import CookingIngredientChecklist from "./CookingIngredientChecklist";
import { useCookingTools } from "./CookingToolsContext";

const DEFAULT_MINUTES = 15;
const MIN_MINUTES = 1;
const MAX_MINUTES = 120;
export const formatTimerSeconds = (seconds: number): string => {
	const safeSeconds = Math.max(0, Number(seconds) || 0);
	const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
	const remainder = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
	return `${minutes}:${remainder}`;
};
type ManualTimerProps = {
	storageKey?: string | null;
};

const ManualTimer = ({ storageKey = null }: ManualTimerProps): ReactElement => {
	const cookingTools = useCookingTools();
	const effectiveStorageKey = storageKey ?? cookingTools.storageKey;
	const initialState = readCookingToolsState(effectiveStorageKey);
	const [durationMinutes, setDurationMinutes] = useState(() => initialState.timerDurationSeconds / 60 || DEFAULT_MINUTES);
	const [remainingSeconds, setRemainingSeconds] = useState(initialState.timerRemainingSeconds);
	const [isRunning, setIsRunning] = useState(initialState.timerIsRunning);
	const [timerEndsAt, setTimerEndsAt] = useState<number | null>(initialState.timerEndsAt);
	const [hasStarted, setHasStarted] = useState(initialState.timerRemainingSeconds < initialState.timerDurationSeconds || initialState.timerIsRunning);

	useEffect(() => {
		const state = readCookingToolsState(effectiveStorageKey);
		setDurationMinutes(state.timerDurationSeconds / 60 || DEFAULT_MINUTES);
		setRemainingSeconds(state.timerRemainingSeconds);
		setIsRunning(state.timerIsRunning);
		setTimerEndsAt(state.timerEndsAt);
		setHasStarted(state.timerRemainingSeconds < state.timerDurationSeconds || state.timerIsRunning);
	}, [effectiveStorageKey]);

	useEffect(() => {
		if (!isRunning) return undefined;
		const intervalId = window.setInterval(() => {
			const next = timerEndsAt === null ? 0 : Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
			setRemainingSeconds(next);
			if (next === 0) {
				setIsRunning(false);
				setTimerEndsAt(null);
			}
		}, 1000);
		return () => window.clearInterval(intervalId);
	}, [isRunning, timerEndsAt]);

	useEffect(() => {
		if (!effectiveStorageKey) return;
		const state = defaultCookingToolsState();
		state.timerDurationSeconds = durationMinutes * 60;
		state.timerRemainingSeconds = remainingSeconds;
		state.timerIsRunning = isRunning;
		state.timerEndsAt = timerEndsAt;
		state.checkedIngredients = readCookingToolsState(effectiveStorageKey).checkedIngredients;
		writeCookingToolsState(effectiveStorageKey, state);
	}, [durationMinutes, effectiveStorageKey, isRunning, remainingSeconds, timerEndsAt]);

	const reset = (): void => {
		setIsRunning(false);
		setHasStarted(false);
		setTimerEndsAt(null);
		setRemainingSeconds(durationMinutes * 60);
	};

	const start = (): void => {
		const nextRemaining = remainingSeconds > 0 ? remainingSeconds : durationMinutes * 60;
		setRemainingSeconds(nextRemaining);
		setHasStarted(true);
		setTimerEndsAt(Date.now() + nextRemaining * 1000);
		setIsRunning(true);
	};

	const pause = (): void => {
		const nextRemaining = timerEndsAt === null ? remainingSeconds : Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
		setRemainingSeconds(nextRemaining);
		setTimerEndsAt(null);
		setIsRunning(false);
	};

	const updateDuration = (event: ChangeEvent<HTMLInputElement>): void => {
		const nextMinutes = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Number(event.target.value) || MIN_MINUTES));
		setDurationMinutes(nextMinutes);
		if (!isRunning) setRemainingSeconds(nextMinutes * 60);
	};

	return <><CookingIngredientChecklist ingredients={cookingTools.ingredients} storageKey={effectiveStorageKey} /><section className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="manual-timer-title"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Timer className="size-5 text-primary" /><h2 id="manual-timer-title" className="text-lg font-black">Manual timer</h2></div><p className="mt-1 text-sm text-muted-foreground">Set a timer for this step. It keeps its place if you leave and resume cooking.</p></div><strong className="tabular-nums text-4xl font-black tracking-tight text-foreground sm:text-5xl" aria-live="polite">{formatTimerSeconds(remainingSeconds)}</strong></div><div className="mt-5 grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-end"><label htmlFor="manual-timer-minutes" className="grid gap-2 text-sm font-bold">Minutes<Input id="manual-timer-minutes" type="number" min={MIN_MINUTES} max={MAX_MINUTES} value={durationMinutes} disabled={isRunning} onChange={updateDuration} /></label><div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">{isRunning ? <Button type="button" variant="secondary" onClick={pause} aria-label="Pause timer"><Pause className="size-4" />Pause</Button> : <Button type="button" onClick={start} aria-label={hasStarted && remainingSeconds > 0 ? "Resume timer" : "Start timer"}><Play className="size-4" />{hasStarted && remainingSeconds > 0 ? "Resume" : "Start"}</Button>}<Button type="button" variant="outline" onClick={reset} aria-label="Reset timer"><RotateCcw className="size-4" />Reset</Button></div></div></section></>;
};
export default ManualTimer;
