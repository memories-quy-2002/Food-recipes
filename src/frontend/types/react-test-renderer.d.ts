declare module "react-test-renderer" {
	import type { ReactElement } from "react";

	export type ReactTestChild = ReactTestInstance | string;

	export interface ReactTestInstance {
		type: unknown;
		props: Record<string, unknown>;
		children: ReactTestChild[];
		findByType(type: unknown): ReactTestInstance;
		findAll(
			predicate: (node: ReactTestInstance) => boolean,
		): ReactTestInstance[];
	}

	export interface ReactTestRenderer {
		root: ReactTestInstance;
		unmount: () => void;
	}

	export const create: (element: ReactElement) => ReactTestRenderer;
	export const act: (
		callback: () => void | Promise<void>,
	) => void | Promise<void>;

	const TestRenderer: {
		create: typeof create;
	};

	export default TestRenderer;
}
