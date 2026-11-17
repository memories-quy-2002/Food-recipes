import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/shared/lib/utils";

export type PageHeaderProps = {
	eyebrow?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	headingId?: string;
	className?: string;
	contentClassName?: string;
	eyebrowClassName?: string;
	titleClassName?: string;
	descriptionClassName?: string;
	actionsClassName?: string;
};

const PageHeader = ({
	eyebrow,
	title,
	description,
	actions,
	headingId,
	className,
	contentClassName,
	eyebrowClassName,
	titleClassName,
	descriptionClassName,
	actionsClassName,
}: PageHeaderProps) => {
	const generatedId = useId();

	return (
		<header className={cn("mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between", className)}>
			<div className={cn("max-w-2xl", contentClassName)}>
				{eyebrow && <p className={cn("mb-2 text-sm font-bold uppercase tracking-[0.16em] text-primary", eyebrowClassName)}>{eyebrow}</p>}
				<h1 id={headingId ?? generatedId} className={cn("text-4xl font-black tracking-tight sm:text-5xl", titleClassName)}>{title}</h1>
				{description && <p className={cn("mt-3 max-w-2xl text-muted-foreground", descriptionClassName)}>{description}</p>}
			</div>
			{actions && <div className={cn("flex w-full flex-col gap-2 sm:w-auto sm:flex-row", actionsClassName)}>{actions}</div>}
		</header>
	);
};

export default PageHeader;
