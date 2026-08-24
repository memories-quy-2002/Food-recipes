import type { WeekRange } from "../api/planningDates";

type WeekNavigatorProps = {
	range: WeekRange;
	onPrevious: () => void;
	onNext: () => void;
	isCurrentWeek: boolean;
};

const formatWeekTitle = (range: WeekRange) => {
	const from = new Date(`${range.from}T00:00:00.000Z`);
	const to = new Date(`${range.to}T00:00:00.000Z`);
	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});

	return `${formatter.format(from)} – ${formatter.format(to)}`;
};

const WeekNavigator = ({
	range,
	onPrevious,
	onNext,
	isCurrentWeek,
}: WeekNavigatorProps) => (
	<div className="planning-week-navigator">
		<div>
			<p className="planning-page__eyebrow">Week at a glance</p>
			<h2 id="planning-week-title">{formatWeekTitle(range)}</h2>
			{isCurrentWeek && <span className="planning-week-navigator__current">Current week</span>}
		</div>
		<div className="planning-week-navigator__actions" aria-label="Week navigation">
			<button type="button" onClick={onPrevious} aria-label="Previous week">
				<span aria-hidden="true">←</span>
			</button>
			<button type="button" onClick={onNext} aria-label="Next week">
				<span aria-hidden="true">→</span>
			</button>
		</div>
	</div>
);

export default WeekNavigator;
