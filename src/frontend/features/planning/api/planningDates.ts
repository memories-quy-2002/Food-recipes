export type PlanningDay = {
	date: string;
	label: string;
	shortLabel: string;
	dayNumber: string;
};

export type WeekRange = {
	from: string;
	to: string;
	days: PlanningDay[];
};

const pad = (value: number) => String(value).padStart(2, "0");

export const toIsoDate = (date: Date): string =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromIsoDate = (value: string): Date => {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(year, month - 1, day);
};

const createPlanningDay = (date: Date): PlanningDay => {
	const isoDate = toIsoDate(date);
	const utcDate = new Date(`${isoDate}T00:00:00.000Z`);
	const labelFormatter = new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
	const shortLabelFormatter = new Intl.DateTimeFormat("en-US", {
		weekday: "short",
		timeZone: "UTC",
	});

	return {
		date: isoDate,
		label: labelFormatter.format(utcDate),
		shortLabel: shortLabelFormatter.format(utcDate),
		dayNumber: new Intl.DateTimeFormat("en-US", {
			day: "2-digit",
			timeZone: "UTC",
		}).format(utcDate),
	};
};

export const getWeekRange = (date: Date): WeekRange => {
	const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const dayOfWeek = localDate.getDay();
	const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
	const monday = new Date(localDate);
	monday.setDate(localDate.getDate() + daysFromMonday);

	const days = Array.from({ length: 7 }, (_, index) => {
		const day = new Date(monday);
		day.setDate(monday.getDate() + index);
		return createPlanningDay(day);
	});

	return {
		from: days[0].date,
		to: days[days.length - 1].date,
		days,
	};
};

export const shiftWeek = (from: string, offset: number): WeekRange => {
	const start = fromIsoDate(from);
	start.setDate(start.getDate() + offset * 7);
	return getWeekRange(start);
};

export const getWeekdayLabel = (isoDate: string): string =>
	new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		timeZone: "UTC",
	}).format(new Date(`${isoDate}T00:00:00.000Z`));
