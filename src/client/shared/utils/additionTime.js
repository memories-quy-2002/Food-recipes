import convertTime from "./convertTime";

const convertTimetoSecond = (time) => {
	let { hours = 0, minutes = 0, seconds = 0 } = time;
	return hours * 3600 + minutes * 60 + seconds;
};

const additionTime = (time1, time2) => {
	let timeSeconds1 = convertTimetoSecond(time1);
	let timeSeconds2 = convertTimetoSecond(time2);
	const d = new Date((timeSeconds1 + timeSeconds2) * 1000);
	return convertTime({
		hours: d.getUTCHours(),
		minutes: d.getUTCMinutes(),
		seconds: d.getUTCSeconds(),
	});
};

export default additionTime;
