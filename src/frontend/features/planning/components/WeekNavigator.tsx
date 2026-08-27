import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import type { WeekRange } from "../api/planningDates";

type WeekNavigatorProps = { range: WeekRange; onPrevious: () => void; onNext: () => void; isCurrentWeek: boolean };
const formatWeekTitle = (range: WeekRange) => { const from = new Date(`${range.from}T00:00:00.000Z`); const to = new Date(`${range.to}T00:00:00.000Z`); const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }); return `${formatter.format(from)} – ${formatter.format(to)}`; };
const WeekNavigator = ({ range, onPrevious, onNext, isCurrentWeek }: WeekNavigatorProps) => <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Week at a glance</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 id="planning-week-title" className="text-2xl font-black sm:text-3xl">{formatWeekTitle(range)}</h2>{isCurrentWeek && <Badge variant="secondary">Current week</Badge>}</div></div><div className="flex gap-2" role="group" aria-label="Week navigation"><Button variant="outline" size="icon" className="size-11" onClick={onPrevious} aria-label="Previous week"><ChevronLeft className="size-5" /></Button><Button variant="outline" size="icon" className="size-11" onClick={onNext} aria-label="Next week"><ChevronRight className="size-5" /></Button></div></div>;
export default WeekNavigator;
