import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import RecipeReviewList from "./RecipeReviewList";

describe("recipe review list", () => {
	it("shows the review author's identity and timestamp", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<RecipeReviewList
					reviewList={[
						{
							rating_id: 1,
							score: 5,
							review: "Excellent",
							full_name: "Ava Cook",
							date_added: "2026-08-23T10:00:00.000Z",
						},
					]}
				/>
			);
		});

		expect(renderer.root.findByProps({ children: "Ava Cook" })).toBeTruthy();
		expect(renderer.root.findByType("time").props.dateTime).toBe(
			"2026-08-23T10:00:00.000Z"
		);
	});

	it("reports that review reporting is unavailable without rendering a fake mutation", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<RecipeReviewList
					reviewList={[
						{
							rating_id: 2,
							score: 3,
							full_name: "Sam Baker",
							date_added: "2026-08-22T10:00:00.000Z",
						},
					]}
				/>
			);
		});

		expect(renderer.root.findByProps({ role: "note" }).children.join(" ")).toContain(
			"Reporting reviews is not available yet"
		);
		expect(renderer.root.findAllByRole).toBeUndefined();
	});
});
