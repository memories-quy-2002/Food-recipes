const convertTime = ({ days = 0, hours = 0, minutes = 0, seconds = 0 }) => {
	const parts = [];

	if (days) parts.push(`${days} day(s)`);
	if (hours) parts.push(`${hours} hour(s)`);
	if (minutes) parts.push(`${minutes} minute(s)`);
	if (seconds) parts.push(`${seconds} second(s)`);

	return parts.length ? parts.join(" ") : "No time";
};

export default convertTime;
