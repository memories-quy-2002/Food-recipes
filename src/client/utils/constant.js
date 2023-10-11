export const USER_REGEX = /^\[A-z\][A-z0-9-_]{3,23}$/;
export const PWD_REGEX =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
export const EMAIL_REGEX =
	/^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/;
