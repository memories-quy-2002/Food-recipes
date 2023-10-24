const convertTime = (time) => {
	var result = ``;
	const { hours = 0, minutes = 0, seconds = 0 } = time;
	if (hours > 0) {
		result += `${hours} hour(s) `;
	}
	if (minutes > 0) {
		result += `${minutes} minute(s) `;
	}
	if (seconds > 0) {
		result += `${seconds} second(s)`;
	}
	return result;
};
export default convertTime;
