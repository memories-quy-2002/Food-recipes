const convertTime = (time) => {
	var result = ``;
	const { days = 0, hours = 0, minutes = 0, seconds = 0 } = time;
	if (days > 0) {
		result += `${days} day(s) `;
	}
	if (hours > 0) {
		result += `${hours} hour(s) `;
	}
	if (minutes > 0) {
		result += `${minutes} minute(s) `;
	}
	if (seconds > 0) {
		result += `${seconds} second(s)`;
	}
	if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
		result = "No time";
	}
	return result;
};
export default convertTime;
