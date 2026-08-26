import convertTime from "./convertTime";

export type TimeParts = {
	days?: number;
	hours?: number;
	minutes?: number;
	seconds?: number;
};

const convertTimetoSecond = ({
	hours = 0,
	minutes = 0,
	seconds = 0,
}: TimeParts): number => hours * 3600 + minutes * 60 + seconds;

const additionTime = (time1: TimeParts, time2: TimeParts): string => {
	const timeSeconds1 = convertTimetoSecond(time1);
	const timeSeconds2 = convertTimetoSecond(time2);
	const date = new Date((timeSeconds1 + timeSeconds2) * 1000);
	return convertTime({
		hours: date.getUTCHours(),
		minutes: date.getUTCMinutes(),
		seconds: date.getUTCSeconds(),
	});
};

export default additionTime;
