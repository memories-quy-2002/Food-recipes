declare module "react-test-renderer" {
	import type { ReactElement } from "react";

	export type ReactTestChild = ReactTestInstance | string;

	export interface ReactTestInstance {
		type: unknown;
		props: Record<string, unknown>;
		children: ReactTestChild[];
		findByType(type: unknown): ReactTestInstance;
		findAllByType(type: unknown): ReactTestInstance[];
		findByProps(props: Record<string, unknown>): ReactTestInstance;
		findAllByProps(props: Record<string, unknown>): ReactTestInstance[];
		findAll(
			predicate: (node: ReactTestInstance) => boolean,
		): ReactTestInstance[];
	}

	export interface ReactTestRenderer {
		root: ReactTestInstance;
		unmount: () => void;
		update: (element: ReactElement) => void;
	}

	export const create: (element: ReactElement) => ReactTestRenderer;
	export const act: (callback: () => unknown) => void | Promise<void>;

	const TestRenderer: {
		create: typeof create;
	};

	export default TestRenderer;
}
