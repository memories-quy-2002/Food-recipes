import axios from "@/shared/api/axios";

export const HOUSEHOLD_ROLES = ["OWNER", "MEMBER", "VIEWER"] as const;
export type HouseholdRole = (typeof HOUSEHOLD_ROLES)[number];

export type HouseholdSummary = {
	household_id: number;
	name: string;
	role: HouseholdRole;
	created_by?: number;
	created_at?: string;
	updated_at?: string;
};

export type HouseholdMember = {
	member_id: number;
	household_id: number;
	user_id: number;
	role: HouseholdRole;
	full_name?: string;
	email?: string;
};

export type HouseholdDetailsResponse = {
	household: HouseholdSummary;
	members: HouseholdMember[];
};

export type HouseholdListResponse = { households: HouseholdSummary[] };
export type HouseholdMutationResponse = { household: HouseholdSummary };
export type HouseholdInviteResponse = {
	 invite: { invite_id: number; household_id: number; email: string; expires_at: string };
	 token: string;
};

export const listHouseholds = async (signal?: AbortSignal): Promise<HouseholdListResponse> => {
	const response = await axios.get<HouseholdListResponse>("/households", { signal });
	return response.data;
};

export const getHousehold = async (householdId: number): Promise<HouseholdDetailsResponse> => {
	const response = await axios.get<HouseholdDetailsResponse>(`/households/${householdId}`);
	return response.data;
};

export const createHousehold = async (name: string): Promise<HouseholdMutationResponse> => {
	const response = await axios.post<HouseholdMutationResponse>("/households", { name });
	return response.data;
};

export const createHouseholdInvite = async (householdId: number, email: string): Promise<HouseholdInviteResponse> => {
	const response = await axios.post<HouseholdInviteResponse>(`/households/${householdId}/invites`, { email });
	return response.data;
};

export const acceptHouseholdInvite = async (token: string): Promise<{ household_id: number }> => {
	const response = await axios.post<{ household_id: number }>(`/household-invites/${encodeURIComponent(token)}/accept`);
	return response.data;
};
